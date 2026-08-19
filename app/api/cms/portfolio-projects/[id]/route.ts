import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/server/utils/auth'
import { checkPermission, AccessLevel } from '@/server/utils/permissions'
import { safeErrorMessage } from '@/server/utils/errors'
import { projectsData } from '@/app/iigprojects/data'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!checkPermission(user, 'Projects', AccessLevel.VIEW)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const id = Number((await params).id)

  try {
    const project = await prisma.portfolioProject.findUnique({
      where: { id },
      include: {
        media: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    })
    if (project) return NextResponse.json(project)
  } catch (error: any) {
    console.error('[Portfolio Project GET Error]', error)
  }

  // Fallback to static project metadata without fallback images
  const p = projectsData.find(x => x.id === id) || projectsData[0]
  const fallbackProject = {
    id: p.id,
    name: p.name,
    slug: p.images[0] ? p.images[0].split('/')[1] : p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    location: p.location || 'Tbilisi',
    startingPriceText: p.startingPrice,
    projectType: p.type,
    paymentPlanText: p.paymentPlan,
    sizeText: p.size,
    roiText: p.roi,
    completionText: p.completion,
    description: null,
    coverImageUrl: null,
    isPublished: true,
    sortOrder: p.id,
    media: []
  }

  return NextResponse.json(fallbackProject)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!checkPermission(user, 'Projects', AccessLevel.EDIT)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const id = Number((await params).id)
    const body = await request.json()

    const project = await prisma.portfolioProject.upsert({
      where: { id },
      update: {
        ...(body.name && { name: body.name }),
        ...(body.slug && { slug: body.slug }),
        ...(body.location && { location: body.location }),
        ...(body.city && { location: body.city }),
        ...(body.startingPriceText && { startingPriceText: body.startingPriceText }),
        ...(body.projectType && { projectType: body.projectType }),
        ...(body.paymentPlanText && { paymentPlanText: body.paymentPlanText }),
        ...(body.sizeText && { sizeText: body.sizeText }),
        ...(body.roiText && { roiText: body.roiText }),
        ...(body.completionText && { completionText: body.completionText }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.isPublished !== undefined && { isPublished: body.isPublished }),
        ...(body.coverImageUrl !== undefined && { coverImageUrl: body.coverImageUrl })
      },
      create: {
        id,
        name: body.name || 'Project',
        slug: body.slug || `project-${id}`,
        location: body.location || body.city || 'Tbilisi',
        startingPriceText: body.startingPriceText || '$100,000',
        projectType: body.projectType || 'Apartments',
        paymentPlanText: body.paymentPlanText || '-',
        sizeText: body.sizeText || 'From 50 m²',
        roiText: body.roiText || '10%',
        completionText: body.completionText || 'Q4 2026',
        description: body.description || null,
        isPublished: body.isPublished ?? true,
        coverImageUrl: body.coverImageUrl || null
      }
    })
    return NextResponse.json(project)
  } catch (error: any) {
    return NextResponse.json({ error: safeErrorMessage(error) }, { status: 500 })
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
    await prisma.portfolioProject.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: safeErrorMessage(error) }, { status: 500 })
  }
}
