import { checkPermission, AccessLevel } from '@/server/utils/permissions'
import { getCurrentUser } from '@/server/utils/auth'
import { NextResponse } from 'next/server'
import { MediaService } from '@/server/services/MediaService'
import { prisma } from '@/lib/prisma'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!checkPermission(user, 'Projects', AccessLevel.EDIT)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const id = Number((await params).id)
    const { name } = await request.json()
    try {
      const updated = await prisma.portfolioMedia.update({
        where: { id },
        data: { name }
      })
      return NextResponse.json(updated)
    } catch {
      const updated = await prisma.media.update({
        where: { id },
        data: { name }
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
  if (!checkPermission(user, 'Projects', AccessLevel.EDIT, true)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const id = Number((await params).id)
    const pfMedia = await prisma.portfolioMedia.findUnique({ where: { id } })
    if (pfMedia) {
      await prisma.portfolioMedia.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }
    const media = await prisma.media.findUnique({ where: { id } })
    await MediaService.delete(id, media?.url)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
