import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/server/utils/auth'
import { checkPermission, AccessLevel } from '@/server/utils/permissions'
import { safeErrorMessage } from '@/server/utils/errors'
import { reorderStoredMedia } from '@/lib/portfolio-store'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!checkPermission(user, 'ProjectPortfolio', AccessLevel.EDIT)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const portfolioProjectId = Number((await params).id)
    const { items } = await request.json()

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid items array' }, { status: 400 })
    }

    // 1. Update in Database
    try {
      await Promise.all(
        items.map((item: { id: number; sortOrder: number }) =>
          prisma.portfolioMedia.update({
            where: { id: Number(item.id) },
            data: { sortOrder: Number(item.sortOrder) }
          })
        )
      )
    } catch (dbErr) {
      console.warn('[Portfolio Media Reorder DB Warning]', dbErr)
    }

    // 2. Persist in fallback store
    reorderStoredMedia(portfolioProjectId, items)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: safeErrorMessage(error) }, { status: 500 })
  }
}
