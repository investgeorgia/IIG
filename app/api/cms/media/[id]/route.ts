import { checkPermission, AccessLevel } from '@/server/utils/permissions'
import { getCurrentUser } from '@/server/utils/auth'
import { NextResponse } from 'next/server'
import { MediaService } from '@/server/services/MediaService'
import { prisma } from '@/lib/prisma'
import { deleteStoredMedia } from '@/lib/portfolio-store'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!checkPermission(user, 'ProjectPortfolio', AccessLevel.EDIT) && !checkPermission(user, 'Projects', AccessLevel.EDIT)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const id = Number((await params).id)
    const body = await request.json()
    const { name, sortOrder } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (sortOrder !== undefined) updateData.sortOrder = Number(sortOrder)

    try {
      const updated = await prisma.portfolioMedia.update({
        where: { id },
        data: updateData
      })
      return NextResponse.json(updated)
    } catch {
      const updated = await prisma.media.update({
        where: { id },
        data: updateData
      })
      return NextResponse.json(updated)
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!checkPermission(user, 'Projects', AccessLevel.EDIT)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const id = Number((await params).id)

    // Delete from disk store
    deleteStoredMedia(id)

    // Delete from PortfolioMedia if present
    try {
      const pfMedia = await prisma.portfolioMedia.findUnique({ where: { id } })
      if (pfMedia) {
        await prisma.portfolioMedia.delete({ where: { id } })
      }
    } catch (e) {
      console.warn('[Media Delete DB Warning]', e)
    }

    // Delete from inventory Media
    try {
      const media = await prisma.media.findUnique({ where: { id } })
      if (media) {
        await MediaService.delete(id, media.url)
      }
    } catch (e) {
      console.warn('[Inventory Media Delete DB Warning]', e)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
