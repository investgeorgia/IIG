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
    const { target, code } = await request.json()

    if (!target || !target.trim()) {
      return NextResponse.json({ error: 'Target email is required' }, { status: 400 })
    }
    if (!code || !code.trim()) {
      return NextResponse.json({ error: 'Verification code is required' }, { status: 400 })
    }

    const cleanTarget = target.trim().toLowerCase()
    const cleanCode = code.trim()

    // Ensure table exists on production DB
    await ensureOtpTableExists()

    // Find the latest active OTP for this target
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        target: cleanTarget,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!otpRecord) {
      return NextResponse.json({ error: 'No verification code found. Please request a code.' }, { status: 400 })
    }

    if (otpRecord.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Verification code has expired. Please request a new code.' }, { status: 400 })
    }

    // Check attempt limit
    if (otpRecord.attempts >= 5) {
      return NextResponse.json({
        error: 'Too many failed attempts. Please request a new verification code.'
      }, { status: 400 })
    }

    // Check code match
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

    // Mark verified
    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { verified: true }
    })

    return NextResponse.json({
      success: true,
      message: 'Email address verified successfully!'
    })

  } catch (error: any) {
    console.error('Failed to verify OTP:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to verify OTP' },
      { status: 500 }
    )
  }
}
