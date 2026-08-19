import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/server/utils/auth'
import { checkPermission, AccessLevel } from '@/server/utils/permissions'
import { safeErrorMessage } from '@/server/utils/errors'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!checkPermission(user, 'Projects', AccessLevel.VIEW)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const id = Number((await params).id)
    const media = await prisma.portfolioMedia.findMany({
      where: { portfolioProjectId: id },
      orderBy: { sortOrder: 'asc' }
    })
    return NextResponse.json(media)
  } catch (error: any) {
    return NextResponse.json({ error: safeErrorMessage(error) }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!checkPermission(user, 'Projects', AccessLevel.EDIT)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const portfolioProjectId = Number((await params).id)
    const body = await request.json()
    const { type, url, name, size, mimeType } = body

    const media = await prisma.portfolioMedia.create({
      data: {
        portfolioProjectId,
        type: type === 'VIDEO' ? 'VIDEO' : 'IMAGE',
        url,
        name: name || 'Uploaded Asset',
        size: size ? Number(size) : undefined,
        mimeType: mimeType || undefined
      }
    })

    // If project has no cover image yet, set this as cover
    const project = await prisma.portfolioProject.findUnique({ where: { id: portfolioProjectId } })
    if (project && !project.coverImageUrl) {
      await prisma.portfolioProject.update({
        where: { id: portfolioProjectId },
        data: { coverImageUrl: url }
      })
    }

    return NextResponse.json(media)
  } catch (error: any) {
    return NextResponse.json({ error: safeErrorMessage(error) }, { status: 500 })
  }
}
