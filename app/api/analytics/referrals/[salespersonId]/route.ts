import { NextResponse } from 'next/server'
import { AuthService } from '@/server/services/AuthService'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { TrackingEventType } from '@prisma/client'

function dateRange(from?: string | null, to?: string | null) {
  const now = new Date()
  const start = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)
  const end   = to   ? new Date(to)   : new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  return { gte: start, lte: end }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ salespersonId: string }> }
) {
  // Auth — Admin only
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = await AuthService.verifyToken(token)
    if (!payload || !payload.sub) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await prisma.user.findUnique({
      where: { id: Number(payload.sub) },
      select: { roleId: true }
    })
    if (!user || user.roleId !== 1) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { salespersonId: rawId } = await params
  const id = parseInt(rawId, 10)
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  const { searchParams } = new URL(request.url)
  const range = dateRange(searchParams.get('from'), searchParams.get('to'))

  const [salesperson, visitEvents, clickEvents] = await Promise.all([
    prisma.salesperson.findUnique({
      where: { id },
      select: { id: true, name: true, slug: true, email: true, phone: true },
    }),
    prisma.referralTrackingEvent.findMany({
      where: { salespersonId: id, eventType: TrackingEventType.PAGE_VISIT, createdAt: range },
      select: { visitorId: true, utmSource: true, utmMedium: true, utmCampaign: true, referrerUrl: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.referralTrackingEvent.findMany({
      where: { salespersonId: id, eventType: TrackingEventType.WHATSAPP_CLICK, createdAt: range },
      select: { visitorId: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  if (!salesperson) return NextResponse.json({ error: 'Salesperson not found' }, { status: 404 })

  const totalVisits    = visitEvents.length
  const uniqueVisitors = new Set(visitEvents.map(e => e.visitorId)).size
  const whatsappClicks = clickEvents.length
  const conversionRate = totalVisits > 0 ? Math.round((whatsappClicks / totalVisits) * 100) : 0

  // Source breakdown
  const sourceMap = new Map<string, number>()
  for (const ev of visitEvents) {
    const src = ev.utmSource || 'direct'
    sourceMap.set(src, (sourceMap.get(src) ?? 0) + 1)
  }
  const bySource = Array.from(sourceMap.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)

  // Recent events combined (last 50)
  const recentVisits = visitEvents.slice(0, 50).map(e => ({
    eventType: 'PAGE_VISIT' as const,
    utmSource: e.utmSource,
    utmCampaign: e.utmCampaign,
    createdAt: e.createdAt,
  }))
  const recentClicks = clickEvents.slice(0, 50).map(e => ({
    eventType: 'WHATSAPP_CLICK' as const,
    utmSource: null,
    utmCampaign: null,
    createdAt: e.createdAt,
  }))
  const recentEvents = [...recentVisits, ...recentClicks]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 50)

  return NextResponse.json({
    salesperson,
    totalVisits,
    uniqueVisitors,
    whatsappClicks,
    conversionRate,
    bySource,
    recentEvents,
  })
}
