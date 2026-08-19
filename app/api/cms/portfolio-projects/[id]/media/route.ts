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

  const id = Number((await params).id)

  try {
    const pfProject = await prisma.portfolioProject.findUnique({
      where: { id },
      include: { media: { orderBy: { sortOrder: 'asc' } } }
    })
    if (pfProject) {
      return NextResponse.json(pfProject.media || [])
    }
  } catch (error: any) {
    console.error('[Portfolio Media GET Error]', error)
  }

  // Return empty array (never inject hardcoded synthetic fallback images)
  return NextResponse.json([])
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

    // If project cover is missing, update cover
    try {
      const project = await prisma.portfolioProject.findUnique({ where: { id: portfolioProjectId } })
      if (project && !project.coverImageUrl) {
        await prisma.portfolioProject.update({
          where: { id: portfolioProjectId },
          data: { coverImageUrl: url }
        })
      }
    } catch (e) {
      console.warn('Could not update cover image URL:', e)
    }

    return NextResponse.json(media)
  } catch (error: any) {
    return NextResponse.json({ error: safeErrorMessage(error) }, { status: 500 })
  }
}
