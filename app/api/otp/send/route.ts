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

    if (channel === 'WHATSAPP') {
      const apiKey = process.env.WAZZUP_API_KEY
      const channelId = process.env.WAZZUP_CHANNEL_ID
      const formattedPhone = cleanTarget.replace(/[^0-9]/g, '')

      if (apiKey && channelId) {
        try {
          const wazzupRes = await fetch('https://api.wazzup24.com/v3/message', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              channelId,
              chatType: 'whatsapp',
              chatId: formattedPhone,
              text: `Your IPS 2026 verification code is: ${code}\nValid for 5 minutes.`
            })
          })

          if (wazzupRes.ok) {
            sentReal = true
          } else {
            const errText = await wazzupRes.text()
            console.error('Wazzup API Error:', errText)
          }
        } catch (wazzupErr) {
          console.error('Failed to send WhatsApp message via Wazzup:', wazzupErr)
        }
      } else {
        console.warn(`[DEV/TEST] Wazzup API credentials not configured. WhatsApp OTP Code for ${cleanTarget}: ${code}`)
      }
    } else if (channel === 'EMAIL') {
      const resendApiKey = process.env.RESEND_API_KEY
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'IPS 2026 <onboarding@resend.dev>'

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
              subject: `${code} is your IPS 2026 Verification Code`,
              html: `
                <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; border-radius: 16px; background-color: #ffffff;">
                  <div style="text-align: center; margin-bottom: 24px;">
                    <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #10b981; font-weight: 700;">Exclusive Access</span>
                    <h2 style="margin: 8px 0 0; font-size: 24px; color: #111827; font-weight: 700;">IPS 2026 Registration</h2>
                  </div>
                  <p style="color: #4b5563; font-size: 14px; line-height: 1.5; text-align: center;">
                    Please enter the following 4-digit verification code to complete your registration:
                  </p>
                  <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #059669; padding: 18px; background: #ecfdf5; text-align: center; border-radius: 12px; margin: 24px 0; border: 1px border #a7f3d0;">
                    ${code}
                  </div>
                  <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">
                    This code is valid for 5 minutes. If you did not request this code, please ignore this email.
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
          }
        } catch (resendErr) {
          console.error('Failed to send Email via Resend:', resendErr)
        }
      } else {
        console.warn(`[DEV/TEST] RESEND_API_KEY not configured. Email OTP Code for ${cleanTarget}: ${code}`)
      }
    }

    return NextResponse.json({
      success: true,
      sentReal,
      message: sentReal
        ? `Verification code sent via ${channel === 'WHATSAPP' ? 'WhatsApp' : 'Email'}`
        : `Verification code generated (${channel === 'WHATSAPP' ? 'WhatsApp API not configured, check server console' : 'Resend API key missing, check server console'})`
    })

  } catch (error: any) {
    console.error('Failed to send OTP:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send OTP' },
      { status: 500 }
    )
  }
}
