import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { TrackingService } from '@/server/services/TrackingService'
import { TrackingEventType } from '@prisma/client'

export async function POST(request: Request) {
  try {
    const ip = TrackingService.extractIp(request)
    const userAgent = request.headers.get('user-agent') ?? ''

    // Skip bots to avoid polluting analytics
    if (TrackingService.isBot(userAgent)) {
      return NextResponse.json({ skipped: true, reason: 'bot' })
    }

    // Try to parse JSON for UTMs
    let body: any = {}
    try {
      body = await request.json()
    } catch {
      // Ignore JSON parse errors
    }

    const cookieStore = await cookies()
    const salespersonSlug = cookieStore.get('salesperson')?.value

    let targetSalespersonId: number | null = null

    if (salespersonSlug) {
      const sp = await prisma.salesperson.findUnique({
        where: { slug: salespersonSlug },
        select: { id: true, active: true }
      })
      if (sp?.active) {
        targetSalespersonId = sp.id
      }
    }

    // If no active referral cookie, fallback to a default admin account (e.g., 'admin-sp')
    if (!targetSalespersonId) {
      const adminSp = await prisma.salesperson.findUnique({
        where: { slug: 'admin-sp' },
        select: { id: true, active: true }
      })
      if (adminSp?.active) {
        targetSalespersonId = adminSp.id
      }
    }

    // If we have a valid salesperson to attribute this to, log it
    if (targetSalespersonId) {
      const visitorId = TrackingService.buildVisitorId(ip, userAgent)
      const device    = TrackingService.detectDevice(userAgent)
      const browser   = TrackingService.detectBrowser(userAgent)

      await TrackingService.upsertVisitor(visitorId, ip, userAgent, device, browser)
      
      // Prevent duplicate logging in the same session (rudimentary check using recent events)
      // We check if this visitor just triggered a page visit in the last 1 minute
      const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000)
      const recentVisit = await prisma.referralTrackingEvent.findFirst({
        where: {
          visitorId,
          eventType: TrackingEventType.PAGE_VISIT,
          createdAt: { gte: fiveMinsAgo }
        }
      })

      if (!recentVisit) {
        await TrackingService.logEvent(
          targetSalespersonId,
          visitorId,
          TrackingEventType.PAGE_VISIT,
          body.utm_source,
          body.utm_medium,
          body.utm_campaign,
          body.referrer_url,
        )
        return NextResponse.json({ success: true, logged: true })
      } else {
        return NextResponse.json({ success: true, logged: false, reason: 'recent_visit_exists' })
      }
    }

    return NextResponse.json({ success: true, logged: false, reason: 'no_salesperson_found' })
  } catch (err) {
    console.error('[Pageview Tracking Error]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
