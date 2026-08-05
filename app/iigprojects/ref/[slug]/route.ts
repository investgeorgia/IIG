import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { TrackingService } from '@/server/services/TrackingService'
import { TrackingEventType } from '@prisma/client'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  let salesperson: { id: number; active: boolean } | null = null

  // ── EXISTING REFERRAL LOGIC (unchanged) ──────────────────
  try {
    const { slug } = await params
    const decodedSlug = decodeURIComponent(slug).toLowerCase().trim()

    salesperson = await prisma.salesperson.findUnique({
      where: { slug: decodedSlug },
      select: { id: true, active: true, slug: true, name: true },
    }) as any

    const cookieStore = await cookies()

    if (salesperson && salesperson.active) {
      cookieStore.set('salesperson', decodedSlug, {
        maxAge: 30 * 24 * 60 * 60,
        path: '/',
        secure: true,
        httpOnly: false,
        sameSite: 'lax',
      })
    } else {
      cookieStore.delete('salesperson')
    }
  } catch (err) {
    console.error('[Referral Route Error]', err)
  }


  // ── REDIRECT (unchanged logic, fixed for shared hosting) ─
  const host  = request.headers.get('host')              ?? 'investgeorgia.ae'
  const proto = request.headers.get('x-forwarded-proto') ?? 'https'
  return NextResponse.redirect(`${proto}://${host}/iigprojects`)
}
