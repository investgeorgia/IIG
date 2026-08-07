import { checkPermission, AccessLevel } from '@/server/utils/permissions'
import { getCurrentUser } from '@/server/utils/auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!checkPermission(user, 'Units', AccessLevel.EDIT)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const projectId = Number((await params).id)
    const { floorPlanUrl, unitIds, bedrooms, type } = await request.json()

    if (!floorPlanUrl) {
      return NextResponse.json({ error: 'floorPlanUrl is required' }, { status: 400 })
    }

    const whereClause: any = { projectId }

    if (Array.isArray(unitIds) && unitIds.length > 0) {
      whereClause.id = { in: unitIds.map(Number) }
    } else {
      if (bedrooms !== undefined && bedrooms !== null && bedrooms !== '') {
        whereClause.bedrooms = Number(bedrooms)
      }
      if (type !== undefined && type !== null && type !== '') {
        whereClause.type = type
      }
    }

    const result = await prisma.unit.updateMany({
      where: whereClause,
      data: { floorPlanUrl }
    })

    return NextResponse.json({ success: true, count: result.count })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
