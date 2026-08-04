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

  // ── TRACKING (additive, non-blocking) ────────────────────
  if (salesperson?.active) {
    try {
      const ip        = TrackingService.extractIp(request)
      const userAgent = request.headers.get('user-agent') ?? ''

      // Skip bots
      if (!TrackingService.isBot(userAgent)) {
        const visitorId = TrackingService.buildVisitorId(ip, userAgent)
        const device    = TrackingService.detectDevice(userAgent)
        const browser   = TrackingService.detectBrowser(userAgent)

        const { searchParams } = new URL(request.url)
        const utmSource   = searchParams.get('utm_source')   ?? undefined
        const utmMedium   = searchParams.get('utm_medium')   ?? undefined
        const utmCampaign = searchParams.get('utm_campaign') ?? undefined
        const referrerUrl = request.headers.get('referer')   ?? undefined

        await TrackingService.upsertVisitor(visitorId, ip, userAgent, device, browser)
        await TrackingService.logEvent(
          (salesperson as any).id,
          visitorId,
          TrackingEventType.PAGE_VISIT,
          utmSource,
          utmMedium,
          utmCampaign,
          referrerUrl,
        )
      }
    } catch (trackErr) {
      // Never let tracking failure affect the redirect
      console.error('[Tracking Error]', trackErr)
    }
  }

  // ── REDIRECT (unchanged logic, fixed for shared hosting) ─
  const host  = request.headers.get('host')              ?? 'investgeorgia.ae'
  const proto = request.headers.get('x-forwarded-proto') ?? 'https'
  return NextResponse.redirect(`${proto}://${host}/iigprojects`)
}
