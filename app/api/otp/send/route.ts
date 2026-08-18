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
    const { target } = await request.json()

    if (!target || !target.trim()) {
      return NextResponse.json({ error: 'Target email address is required' }, { status: 400 })
    }

    const cleanTarget = target.trim().toLowerCase()
    
    // Generate 4-digit OTP code
    const code = Math.floor(1000 + Math.random() * 9000).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes expiration

    // Ensure table exists on production DB
    await ensureOtpTableExists()

    // Store in DB
    await prisma.otpVerification.create({
      data: {
        target: cleanTarget,
        channel: 'EMAIL',
        code,
        expiresAt,
      }
    })

    let sentReal = false
    let lastError = ''

    const resendApiKey = process.env.RESEND_API_KEY?.trim()
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
                  <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 3px; color: #ca2d39; font-weight: 700;">Invest Georgia UAE</span>
                  <h2 style="margin: 8px 0 0; font-size: 26px; color: #ffffff; font-weight: 700; font-family: Georgia, serif;">Email Verification</h2>
                </div>
                <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; text-align: center; margin-bottom: 24px;">
                  Thank you for registering with <strong>Invest Georgia UAE</strong> for the International Property Show (IPS 2026). Please enter the 4-digit verification code below to verify your email:
                </p>
                <div style="font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #ca2d39; padding: 20px; background: #18181b; text-align: center; border-radius: 14px; margin: 24px 0; border: 1px solid #27272a;">
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

    if (!sentReal && resendApiKey) {
      return NextResponse.json({
        error: lastError || 'Could not deliver verification email.'
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      sentReal,
      message: 'Verification code sent to your email'
    })

  } catch (error: any) {
    console.error('Failed to send OTP:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send OTP' },
      { status: 500 }
    )
  }
}
