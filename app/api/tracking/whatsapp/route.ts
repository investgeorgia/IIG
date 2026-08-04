import { NextResponse } from 'next/server'
import { TrackingService } from '@/server/services/TrackingService'
import { TrackingEventType } from '@prisma/client'
import { z } from 'zod'

const schema = z.object({
  salespersonId: z.number().int().positive(),
  whatsappUrl:   z.string().url(),
})

export async function POST(request: Request) {
  try {
    const body   = await request.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const { salespersonId, whatsappUrl } = parsed.data
    const ip        = TrackingService.extractIp(request)
    const userAgent = request.headers.get('user-agent') ?? ''

    // Skip bots
    if (!TrackingService.isBot(userAgent)) {
      const visitorId = TrackingService.buildVisitorId(ip, userAgent)
      const device    = TrackingService.detectDevice(userAgent)
      const browser   = TrackingService.detectBrowser(userAgent)

      await TrackingService.upsertVisitor(visitorId, ip, userAgent, device, browser)
      await TrackingService.logEvent(
        salespersonId,
        visitorId,
        TrackingEventType.WHATSAPP_CLICK,
      )
    }

    return NextResponse.json({ url: whatsappUrl })
  } catch (err) {
    console.error('[WhatsApp Tracking Error]', err)
    // Still return the URL so the user can reach WhatsApp even if tracking fails
    try {
      const body = await request.clone().json()
      return NextResponse.json({ url: body?.whatsappUrl ?? '' })
    } catch {
      return NextResponse.json({ url: '' })
    }
  }
}
