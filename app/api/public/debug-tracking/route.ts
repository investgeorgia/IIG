import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/server/utils/auth'

export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (user.role.name !== 'Admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

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
