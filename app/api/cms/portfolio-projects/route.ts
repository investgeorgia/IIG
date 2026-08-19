import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/server/utils/auth'
import { checkPermission, AccessLevel } from '@/server/utils/permissions'
import { safeErrorMessage } from '@/server/utils/errors'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!checkPermission(user, 'Projects', AccessLevel.VIEW)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const projects = await prisma.portfolioProject.findMany({
      include: {
        media: {
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { sortOrder: 'asc' }
    })
    return NextResponse.json(projects)
  } catch (error: any) {
    return NextResponse.json({ error: safeErrorMessage(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!checkPermission(user, 'Projects', AccessLevel.EDIT)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { name, slug, location, startingPriceText, projectType, paymentPlanText, sizeText, roiText, completionText, description, isPublished } = body

    const generatedSlug = (slug || name || 'project').toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-')

    const project = await prisma.portfolioProject.create({
      data: {
        name,
        slug: generatedSlug,
        location: location || 'Tbilisi',
        startingPriceText: startingPriceText || '$100,000',
        projectType: projectType || 'Apartments',
        paymentPlanText: paymentPlanText || '-',
        sizeText: sizeText || 'From 50 m²',
        roiText: roiText || '10%',
        completionText: completionText || 'Q4 2026',
        description: description || null,
        isPublished: isPublished ?? true,
      }
    })

    return NextResponse.json(project)
  } catch (error: any) {
    return NextResponse.json({ error: safeErrorMessage(error) }, { status: 500 })
  }
}
