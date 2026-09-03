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

// Helper to format phone number to E.164 standard
function formatE164Phone(countryCode: string, phone: string): string {
  const cleanCc = countryCode.trim().startsWith('+') 
    ? '+' + countryCode.trim().replace(/[^0-9]/g, '')
    : '+' + countryCode.trim().replace(/[^0-9]/g, '')
    
  const cleanPhone = phone.trim().replace(/[^0-9]/g, '').replace(/^0+/, '')
  return `${cleanCc}${cleanPhone}`
}

export async function POST(request: Request) {
  try {
    const { countryCode = '+971', phone, code } = await request.json()

    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    if (!code || !code.trim()) {
      return NextResponse.json({ error: 'Verification code is required' }, { status: 400 })
    }

    const formattedPhone = formatE164Phone(countryCode, phone)
    const cleanCode = code.trim()

    const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim()
    const authToken = process.env.TWILIO_AUTH_TOKEN?.trim()
    const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID?.trim()

    // If Twilio credentials are configured, use Twilio VerificationCheck API
    if (accountSid && authToken && serviceSid) {
      try {
        const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64')
        const bodyParams = new URLSearchParams()
        bodyParams.append('To', formattedPhone)
        bodyParams.append('Code', cleanCode)

        const twilioRes = await fetch(
          `https://verify.twilio.com/v2/Services/${serviceSid}/VerificationCheck`,
          {
            method: 'POST',
            headers: {
              'Authorization': authHeader,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: bodyParams.toString(),
          }
        )

        const twilioData = await twilioRes.json()

        if (!twilioRes.ok) {
          console.error('Twilio Verify Check Error:', twilioData)
          const errorMsg = twilioData.message || twilioData.error_message || 'Verification check failed'
          return NextResponse.json({ error: errorMsg }, { status: twilioRes.status || 400 })
        }

        if (twilioData.status === 'approved' || twilioData.valid === true) {
          return NextResponse.json({
            success: true,
            verified: true,
            message: 'Phone number verified successfully via Twilio!'
          })
        } else {
          return NextResponse.json({
            error: 'Incorrect or expired verification code. Please try again.'
          }, { status: 400 })
        }

      } catch (twilioErr: any) {
        console.error('Twilio VerificationCheck Exception:', twilioErr)
        return NextResponse.json({ error: twilioErr.message || 'Twilio verification check error' }, { status: 500 })
      }
    }

    // --- Dev / Fallback mode if Twilio environment variables are not set yet ---
    console.warn(`[DEV MODE] Twilio credentials not configured. Verifying code for ${formattedPhone}`)

    await ensureOtpTableExists()

    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        target: formattedPhone,
        channel: 'SMS'
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!otpRecord) {
      return NextResponse.json({ error: 'No verification code request found for this phone number.' }, { status: 400 })
    }

    if (otpRecord.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Verification code has expired. Please request a new code.' }, { status: 400 })
    }

    if (otpRecord.attempts >= 5) {
      return NextResponse.json({ error: 'Too many failed attempts. Please request a new verification code.' }, { status: 400 })
    }

    if (otpRecord.code !== cleanCode) {
      const newAttempts = otpRecord.attempts + 1
      await prisma.otpVerification.update({
        where: { id: otpRecord.id },
        data: { attempts: newAttempts }
      })

      return NextResponse.json({
        error: `Incorrect verification code. (${5 - newAttempts} attempt${5 - newAttempts === 1 ? '' : 's'} remaining)`,
        attempts: newAttempts
      }, { status: 400 })
    }

    // Mark as verified
    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { verified: true }
    })

    return NextResponse.json({
      success: true,
      verified: true,
      message: 'Phone number verified successfully!'
    })

  } catch (error: any) {
    console.error('Failed to verify SMS OTP:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to verify SMS code' },
      { status: 500 }
    )
  }
}
