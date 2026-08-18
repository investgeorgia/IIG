import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { target, channel, code } = await request.json()

    if (!target || !target.trim()) {
      return NextResponse.json({ error: 'Target is required' }, { status: 400 })
    }
    if (!channel || (channel !== 'WHATSAPP' && channel !== 'EMAIL')) {
      return NextResponse.json({ error: 'Channel is required' }, { status: 400 })
    }
    if (!code || !code.trim()) {
      return NextResponse.json({ error: 'Verification code is required' }, { status: 400 })
    }

    const cleanTarget = target.trim()
    const cleanCode = code.trim()

    // Find the latest active OTP for this target & channel
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        target: cleanTarget,
        channel,
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
    if (otpRecord.attempts >= 3) {
      const fallbackToEmail = channel === 'WHATSAPP'
      return NextResponse.json({
        error: fallbackToEmail
          ? 'Too many failed attempts. Verification switched to Email.'
          : 'Too many failed attempts. Please request a new code.',
        fallbackToEmail,
        attempts: otpRecord.attempts
      }, { status: 400 })
    }

    // Check code match
    if (otpRecord.code !== cleanCode) {
      const newAttempts = otpRecord.attempts + 1
      await prisma.otpVerification.update({
        where: { id: otpRecord.id },
        data: { attempts: newAttempts }
      })

      const fallbackToEmail = newAttempts >= 3 && channel === 'WHATSAPP'

      return NextResponse.json({
        error: fallbackToEmail
          ? '3 incorrect attempts on WhatsApp. Switching to Email verification.'
          : `Incorrect verification code. (${3 - newAttempts} attempt${3 - newAttempts === 1 ? '' : 's'} remaining)`,
        attempts: newAttempts,
        fallbackToEmail
      }, { status: 400 })
    }

    // Mark verified
    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { verified: true }
    })

    return NextResponse.json({
      success: true,
      message: 'Verification successful'
    })

  } catch (error: any) {
    console.error('Failed to verify OTP:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to verify OTP' },
      { status: 500 }
    )
  }
}
