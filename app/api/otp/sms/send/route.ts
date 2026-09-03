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
    const { countryCode = '+971', phone } = await request.json()

    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    const formattedPhone = formatE164Phone(countryCode, phone)
    
    // Check for E.164 phone length validity (min 8 digits including country code)
    if (formattedPhone.length < 8) {
      return NextResponse.json({ error: 'Please enter a valid phone number' }, { status: 400 })
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim()
    const authToken = process.env.TWILIO_AUTH_TOKEN?.trim()
    const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID?.trim()

    // If Twilio credentials are configured, use Twilio Verify API
    if (accountSid && authToken && serviceSid) {
      try {
        const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64')
        const bodyParams = new URLSearchParams()
        bodyParams.append('To', formattedPhone)
        bodyParams.append('Channel', 'sms')

        const twilioRes = await fetch(
          `https://verify.twilio.com/v2/Services/${serviceSid}/Verifications`,
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
          console.error('Twilio Verify Send Error:', twilioData)
          const errorMsg = twilioData.message || twilioData.error_message || 'Twilio SMS failed'
          return NextResponse.json({ error: `Twilio SMS Error: ${errorMsg}` }, { status: twilioRes.status || 400 })
        }

        return NextResponse.json({
          success: true,
          message: `Verification SMS code sent to ${formattedPhone}`,
          status: twilioData.status
        })

      } catch (twilioErr: any) {
        console.error('Twilio API Exception:', twilioErr)
        return NextResponse.json({ error: twilioErr.message || 'Failed to connect to Twilio SMS service' }, { status: 500 })
      }
    }

    // --- Dev / Fallback mode if Twilio environment variables are not set yet ---
    console.warn(`[DEV MODE] Twilio credentials not configured. Generating test SMS OTP for ${formattedPhone}`)
    
    await ensureOtpTableExists()

    // Fixed test OTP '123456' or random 6-digit code for local testing
    const code = '123456'
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    await prisma.otpVerification.create({
      data: {
        target: formattedPhone,
        channel: 'SMS',
        code,
        expiresAt,
      }
    })

    return NextResponse.json({
      success: true,
      devMode: true,
      message: `[Test Mode] Verification code (123456) generated for ${formattedPhone}`,
    })

  } catch (error: any) {
    console.error('Failed to send SMS OTP:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process SMS OTP request' },
      { status: 500 }
    )
  }
}
