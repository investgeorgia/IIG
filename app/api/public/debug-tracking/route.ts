import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('token') !== 'debug123') return NextResponse.json({ error: 'unauth' })

  const visitors = await prisma.referralVisitor.count()
  const events = await prisma.referralTrackingEvent.count()
  
  const recentEvents = await prisma.referralTrackingEvent.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { salesperson: true }
  })

  return NextResponse.json({
    visitors,
    events,
    recentEvents
  })
}
