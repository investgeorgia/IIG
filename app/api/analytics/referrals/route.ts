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

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url)
  const range = dateRange(searchParams.get('from'), searchParams.get('to'))

  try {
    const [totalVisits, totalClicks, allEvents, salespersons] = await Promise.all([
      // Total page visits
      prisma.referralTrackingEvent.count({
        where: { eventType: TrackingEventType.PAGE_VISIT, createdAt: range },
      }),
      // Total WhatsApp clicks
      prisma.referralTrackingEvent.count({
        where: { eventType: TrackingEventType.WHATSAPP_CLICK, createdAt: range },
      }),
      // All visit events (for unique visitor counting + source breakdown)
      prisma.referralTrackingEvent.findMany({
        where: { eventType: TrackingEventType.PAGE_VISIT, createdAt: range },
        select: { salespersonId: true, visitorId: true, utmSource: true },
      }),
      // All salespersons
      prisma.salesperson.findMany({
        where: { active: true },
        select: { id: true, name: true, slug: true },
      }),
    ])

    // Unique visitors (distinct visitorId across all salespersons)
    const uniqueVisitors = new Set(allEvents.map(e => e.visitorId)).size

    // Per-salesperson breakdown
    const spMap = new Map<number, { visits: number; uniqueVids: Set<string>; clicks: number; name: string; slug: string }>()
    for (const sp of salespersons) {
      spMap.set(sp.id, { visits: 0, uniqueVids: new Set(), clicks: 0, name: sp.name, slug: sp.slug })
    }
    for (const ev of allEvents) {
      const row = spMap.get(ev.salespersonId)
      if (row) { row.visits++; row.uniqueVids.add(ev.visitorId) }
    }

    // Add click counts
    const clickEvents = await prisma.referralTrackingEvent.findMany({
      where: { eventType: TrackingEventType.WHATSAPP_CLICK, createdAt: range },
      select: { salespersonId: true },
    })
    for (const ev of clickEvents) {
      const row = spMap.get(ev.salespersonId)
      if (row) row.clicks++
    }

    const bySalesperson = Array.from(spMap.entries())
      .map(([id, row]) => ({
        id,
        name:           row.name,
        slug:           row.slug,
        totalVisits:    row.visits,
        uniqueVisitors: row.uniqueVids.size,
        whatsappClicks: row.clicks,
        conversionRate: row.visits > 0 ? Math.round((row.clicks / row.visits) * 100) : 0,
      }))
      .sort((a, b) => b.totalVisits - a.totalVisits)

    // Source breakdown
    const sourceMap = new Map<string, number>()
    for (const ev of allEvents) {
      const src = ev.utmSource || 'direct'
      sourceMap.set(src, (sourceMap.get(src) ?? 0) + 1)
    }
    const bySource = Array.from(sourceMap.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)

    const topSalesperson = bySalesperson[0] ?? null
    const topSource      = bySource[0]?.source ?? null

    return NextResponse.json({
      totalVisits,
      uniqueVisitors,
      whatsappClicks: totalClicks,
      topSalesperson: topSalesperson ? { id: topSalesperson.id, name: topSalesperson.name, visits: topSalesperson.totalVisits } : null,
      topSource,
      bySource,
      bySalesperson,
    })
  } catch (error: any) {
    console.error('[Analytics API Error]:', error)
    return NextResponse.json({ error: 'Database query failed: ' + error.message }, { status: 500 })
  }
}
