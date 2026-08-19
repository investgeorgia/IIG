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
    const project = await prisma.portfolioProject.findUnique({
      where: { id },
      include: {
        media: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    })
    if (!project) return NextResponse.json({ error: 'Portfolio project not found' }, { status: 404 })
    return NextResponse.json(project)
  } catch (error: any) {
    return NextResponse.json({ error: safeErrorMessage(error) }, { status: 500 })
  }
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

    const project = await prisma.portfolioProject.update({
      where: { id },
      data: {
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
