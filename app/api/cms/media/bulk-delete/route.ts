import { checkPermission, AccessLevel } from '@/server/utils/permissions'
import { getCurrentUser } from '@/server/utils/auth'
import { NextResponse } from 'next/server'
import { MediaService } from '@/server/services/MediaService'
import { prisma } from '@/lib/prisma'
import { bulkDeleteStoredMedia } from '@/lib/portfolio-store'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!checkPermission(user, 'Projects', AccessLevel.EDIT)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { ids } = await request.json()
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Invalid or empty IDs array' }, { status: 400 })
    }

    const numIds = ids.map((id: any) => Number(id))

    // Delete from disk store
    bulkDeleteStoredMedia(numIds)

    // Delete from PortfolioMedia if present
    try {
      await prisma.portfolioMedia.deleteMany({
        where: { id: { in: numIds } }
      })
    } catch (e) {
      console.warn('[Bulk Delete DB Warning]', e)
    }

    // Also attempt MediaService deletion for inventory media
    await MediaService.bulkDelete(numIds).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
