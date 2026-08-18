import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

async function ensureOtpTableExists() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`OtpVerification\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`target\` VARCHAR(191) NOT NULL,
        \`channel\` VARCHAR(191) NOT NULL,
        \`code\` VARCHAR(191) NOT NULL,
        \`attempts\` INT NOT NULL DEFAULT 0,
        \`expiresAt\` DATETIME(3) NOT NULL,
        \`verified\` BOOLEAN NOT NULL DEFAULT false,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        INDEX \`OtpVerification_target_channel_idx\`(\`target\`, \`channel\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `)
  } catch (err) {
    console.error('Failed to create OtpVerification table via raw SQL:', err)
  }
}

export async function POST(request: Request) {
  try {
    const { target, channel } = await request.json()

    if (!target || !target.trim()) {
      return NextResponse.json({ error: 'Target recipient (phone or email) is required' }, { status: 400 })
    }
    if (!channel || (channel !== 'WHATSAPP' && channel !== 'EMAIL')) {
      return NextResponse.json({ error: 'Valid channel (WHATSAPP or EMAIL) is required' }, { status: 400 })
    }

    const cleanTarget = target.trim()
    // Generate 4-digit OTP code
    const code = Math.floor(1000 + Math.random() * 9000).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes expiration

    // Ensure table exists on production DB
    await ensureOtpTableExists()

    // Store in DB
    await prisma.otpVerification.create({
      data: {
        target: cleanTarget,
        channel,
        code,
        expiresAt,
      }
    })

    let sentReal = false
    let lastError = ''

    if (channel === 'WHATSAPP') {
      const apiKey = process.env.WAZZUP_API_KEY?.trim()
      const channelId = process.env.WAZZUP_CHANNEL_ID?.trim()
      
      let formattedPhone = cleanTarget.replace(/[^0-9]/g, '')
      // Strip leading zero right after common country codes (e.g. 971050... -> 97150...)
      if (formattedPhone.startsWith('9710')) {
        formattedPhone = '971' + formattedPhone.slice(4)
      } else if (formattedPhone.startsWith('9660')) {
        formattedPhone = '966' + formattedPhone.slice(4)
      } else if (formattedPhone.startsWith('440')) {
        formattedPhone = '44' + formattedPhone.slice(3)
      } else if (formattedPhone.startsWith('9950')) {
        formattedPhone = '995' + formattedPhone.slice(4)
      }

      if (apiKey && channelId && channelId !== '') {
        try {
          // 1. Verify Wazzup channel status first
          const channelsRes = await fetch('https://api.wazzup24.com/v3/channels', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          })

          let effectiveChannelId = channelId

          if (channelsRes.ok) {
            const channelsList = await channelsRes.json()
            if (Array.isArray(channelsList) && channelsList.length > 0) {
              const targetChannel = channelsList.find((ch: any) => ch.channelId === channelId)

              if (!targetChannel || targetChannel.state !== 'active') {
                console.warn(`[Wazzup Warning] Configured channel ${channelId} state is "${targetChannel?.state || 'not_found'}". Searching for active channel...`)
                
                // Smart auto-select active channel in Wazzup account
                const activeChannel = channelsList.find((ch: any) => ch.state === 'active')
                if (activeChannel) {
                  effectiveChannelId = activeChannel.channelId
                  console.log(`[Wazzup Auto-Select] Automatically using active Wazzup channel: ${effectiveChannelId} (${activeChannel.plainId || activeChannel.name})`)
                } else {
                  lastError = `All Wazzup WhatsApp channels in account are currently inactive or blocked.`
                }
              }
            }
          }

          if (!lastError && effectiveChannelId) {
            const templateId = process.env.WAZZUP_TEMPLATE_ID?.trim()

            const wazzupBody: any = {
              channelId: effectiveChannelId,
              chatType: 'whatsapp',
              chatId: formattedPhone,
              crmMessageId: crypto.randomUUID()
            }

            if (templateId && templateId !== '') {
              // WABA Approved Template payload format
              wazzupBody.templateId = templateId
              wazzupBody.templateValues = [code]
            } else {
              // Plain text payload format
              wazzupBody.text = `Invest Georgia UAE: Your IPS 2026 verification code is: ${code}\nValid for 5 minutes.`
            }

            // 2. Send message via Wazzup API using the active channel ID
            const wazzupRes = await fetch('https://api.wazzup24.com/v3/message', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(wazzupBody)
            })

            const responseData = await wazzupRes.json().catch(() => null)

            if (wazzupRes.ok && responseData?.messageId) {
              sentReal = true
              console.log(`[Wazzup Success] WhatsApp OTP queued with ID ${responseData.messageId} for ${formattedPhone}`)
            } else {
              const errStr = JSON.stringify(responseData) || 'Unknown Wazzup error'
              console.error('Wazzup API Error response:', errStr)
              
              if (errStr.includes('channelId')) {
                lastError = 'Wazzup Channel ID is invalid or disconnected in your Wazzup account.'
              } else {
                lastError = `Wazzup API Error (${wazzupRes.status}): ${responseData?.description || errStr}`
              }
            }
          }
        } catch (wazzupErr: any) {
          console.error('Failed to send WhatsApp message via Wazzup:', wazzupErr)
          lastError = wazzupErr.message || 'Wazzup connection error'
        }
      } else {
        lastError = 'Wazzup WAZZUP_CHANNEL_ID or WAZZUP_API_KEY is not configured in environment variables (.env)'
        console.warn(`[DEV/TEST] Wazzup API credentials not configured. WhatsApp OTP Code for ${cleanTarget}: ${code}`)
      }

      if (!sentReal) {
        return NextResponse.json({
          success: false,
          fallbackToEmail: true,
          error: lastError || 'Could not deliver WhatsApp code. Switching to Email verification.',
          message: 'WhatsApp delivery failed. Switching to Email verification.'
        }, { status: 400 })
      }
    } else if (channel === 'EMAIL') {
      const resendApiKey = process.env.RESEND_API_KEY
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'Invest Georgia UAE <onboarding@resend.dev>'

      if (resendApiKey) {
        try {
          const resendRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: fromEmail,
              to: [cleanTarget],
              subject: `${code} is your Invest Georgia UAE Verification Code`,
              html: `
                <div style="font-family: Arial, Helvetica, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; border: 1px solid #27272a; border-radius: 20px; background-color: #09090b; color: #ffffff;">
                  <div style="text-align: center; margin-bottom: 28px;">
                    <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 3px; color: #10b981; font-weight: 700;">Invest Georgia UAE</span>
                    <h2 style="margin: 8px 0 0; font-size: 26px; color: #ffffff; font-weight: 700; font-family: Georgia, serif;">IPS 2026 Verification</h2>
                  </div>
                  <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; text-align: center; margin-bottom: 24px;">
                    Thank you for registering with <strong>Invest Georgia UAE</strong> for the International Property Show (IPS 2026). Please enter the 4-digit verification code below:
                  </p>
                  <div style="font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #10b981; padding: 20px; background: #18181b; text-align: center; border-radius: 14px; margin: 24px 0; border: 1px solid #27272a;">
                    ${code}
                  </div>
                  <p style="color: #71717a; font-size: 12px; text-align: center; margin-top: 28px; line-height: 1.5;">
                    This code is valid for 5 minutes.<br>© Invest Georgia UAE. All rights reserved.
                  </p>
                </div>
              `
            })
          })

          if (resendRes.ok) {
            sentReal = true
          } else {
            const errText = await resendRes.text()
            console.error('Resend API Error:', errText)
            lastError = `Resend API Error: ${errText}`
          }
        } catch (resendErr: any) {
          console.error('Failed to send Email via Resend:', resendErr)
          lastError = resendErr.message || 'Resend connection error'
        }
      } else {
        console.warn(`[DEV/TEST] RESEND_API_KEY not configured. Email OTP Code for ${cleanTarget}: ${code}`)
        sentReal = true // allow in dev mode
      }
    }

    return NextResponse.json({
      success: true,
      sentReal,
      message: `Verification code sent via ${channel === 'WHATSAPP' ? 'WhatsApp' : 'Email'}`
    })

  } catch (error: any) {
    console.error('Failed to send OTP:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send OTP' },
      { status: 500 }
    )
  }
}
