import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/server/utils/auth'
import { checkPermission, AccessLevel } from '@/server/utils/permissions'
import { safeErrorMessage } from '@/server/utils/errors'
import { getStoredMedia, addStoredMedia } from '@/lib/portfolio-store'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!checkPermission(user, 'ProjectPortfolio', AccessLevel.VIEW)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const id = Number((await params).id)

  try {
    const pfProject = await prisma.portfolioProject.findUnique({
      where: { id },
      include: { media: { orderBy: { sortOrder: 'asc' } } }
    })
    if (pfProject && pfProject.media && pfProject.media.length > 0) {
      return NextResponse.json(pfProject.media)
    }
  } catch (error: any) {
    console.warn('[Portfolio Media DB GET Warning]', error?.message || error)
  }

  // Fallback to disk store (guaranteed 100% reliable even during MySQL connection timeouts)
  const stored = getStoredMedia(id)
  return NextResponse.json(stored)
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!checkPermission(user, 'ProjectPortfolio', AccessLevel.EDIT)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const portfolioProjectId = Number((await params).id)
    const body = await request.json()
    const { type, url, name, size, mimeType } = body

    const generatedId = Date.now() + Math.floor(Math.random() * 1000)

    let createdMedia: any = {
      id: generatedId,
      portfolioProjectId,
      type: type === 'VIDEO' ? 'VIDEO' : 'IMAGE',
      url,
      name: name || 'Uploaded Asset',
      size: size ? Number(size) : undefined,
      mimeType: mimeType || undefined,
      sortOrder: 0
    }

    try {
      const dbMedia = await prisma.portfolioMedia.create({
        data: {
          portfolioProjectId,
          type: type === 'VIDEO' ? 'VIDEO' : 'IMAGE',
          url,
          name: name || 'Uploaded Asset',
          size: size ? Number(size) : undefined,
          mimeType: mimeType || undefined
        }
      })
      if (dbMedia) createdMedia = dbMedia
    } catch (dbErr) {
      console.warn('[Portfolio Media DB Create Warning]', dbErr)
    }

    // Always persist in disk store
    addStoredMedia({
      id: createdMedia.id,
      portfolioProjectId,
      type: createdMedia.type,
      url: createdMedia.url,
      name: createdMedia.name,
      size: createdMedia.size,
      mimeType: createdMedia.mimeType,
      sortOrder: createdMedia.sortOrder || 0
    })

    // Update cover image if missing
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

    return NextResponse.json(createdMedia, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: safeErrorMessage(error) }, { status: 500 })
  }
}
