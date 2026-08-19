import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/server/utils/auth'
import { checkPermission, AccessLevel } from '@/server/utils/permissions'
import { safeErrorMessage } from '@/server/utils/errors'
import { projectsData } from '@/app/iigprojects/data'

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

    if (projects && projects.length > 0) {
      return NextResponse.json(projects)
    }
  } catch (error: any) {
    console.error('[Portfolio Projects GET Error]', error)
  }

  // Fallback to projectsData
  const fallbackProjects = projectsData.map(p => ({
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
    coverImageUrl: p.thumbnail ? (p.thumbnail.startsWith('/') ? p.thumbnail : `/${p.thumbnail}`) : (p.images[0] ? (p.images[0].startsWith('/') ? p.images[0] : `/${p.images[0]}`) : null),
    isPublished: true,
    sortOrder: p.id,
    media: p.images.map((img, idx) => ({
      id: idx + 1,
      portfolioProjectId: p.id,
      type: 'IMAGE',
      url: img.startsWith('/') ? img : `/${img}`,
      name: `${p.name} image ${idx + 1}`,
      sortOrder: idx
    }))
  }))

  return NextResponse.json(fallbackProjects)
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
