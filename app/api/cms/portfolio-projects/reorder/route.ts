import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/server/utils/auth'
import { checkPermission, AccessLevel } from '@/server/utils/permissions'
import { safeErrorMessage } from '@/server/utils/errors'

export async function PUT(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!checkPermission(user, 'ProjectPortfolio', AccessLevel.EDIT)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { items } = await request.json()

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid items array' }, { status: 400 })
    }

    await Promise.all(
      items.map((item: { id: number; sortOrder: number }) =>
        prisma.portfolioProject.upsert({
          where: { id: Number(item.id) },
          update: { sortOrder: Number(item.sortOrder) },
          create: {
            id: Number(item.id),
            name: `Project ${item.id}`,
            slug: `project-${item.id}`,
            sortOrder: Number(item.sortOrder)
          }
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: safeErrorMessage(error) }, { status: 500 })
  }
}
