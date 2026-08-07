import { NextResponse } from 'next/server'
import { AuthService } from '@/server/services/AuthService'
import { z } from 'zod'
import { cookies } from 'next/headers'
import { rateLimit } from '@/server/utils/rate-limit'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export async function POST(request: Request) {
  try {
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : (request.headers.get('x-real-ip') ?? '127.0.0.1')

    const rateLimitResult = rateLimit(ip)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const result = loginSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const { email, password } = result.data

    const { token, user } = await AuthService.login(email, password)

    // Set HttpOnly cookie
    const cookieStore = await cookies()
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 2 * 60 * 60 // 2 hours
    })

    return NextResponse.json({ 
      success: true, 
      user: { id: user.id, email: user.email, name: user.name, roleId: user.roleId } 
    })
  } catch (error: any) {
    const msg: string = error?.message ?? ''
    // Pool timeout = database unavailable, not an auth failure
    if (msg.includes('pool timeout') || msg.includes('45028') || error?.cause?.code === 45028) {
      return NextResponse.json(
        { error: 'Database temporarily unavailable. Please try again in a moment.' },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }
}
