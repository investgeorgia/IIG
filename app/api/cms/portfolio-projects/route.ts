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

  let dbProjects: any[] = []
  try {
    dbProjects = await prisma.portfolioProject.findMany({
      include: {
        media: {
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { sortOrder: 'asc' }
    })
  } catch (error: any) {
    console.warn('[Portfolio Projects DB GET Warning]', error?.message || error)
  }

  // Create a map of DB projects by ID / slug / name
  const dbMap = new Map<string, any>()
  for (const p of dbProjects) {
    dbMap.set(String(p.id), p)
    if (p.slug) dbMap.set(p.slug.toLowerCase(), p)
    if (p.name) dbMap.set(p.name.toLowerCase(), p)
  }

  // Merge projectsData with DB records cleanly (without forcing hardcoded fallback media)
  const mergedProjects = projectsData.map(p => {
    const slug = p.images[0] ? p.images[0].split('/')[1] : p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const dbMatch = dbMap.get(String(p.id)) || dbMap.get(slug.toLowerCase()) || dbMap.get(p.name.toLowerCase())

    if (dbMatch) {
      return {
        ...dbMatch,
        name: dbMatch.name || p.name,
        slug: dbMatch.slug || slug,
        location: dbMatch.location || p.location || 'Tbilisi',
        startingPriceText: dbMatch.startingPriceText || p.startingPrice,
        projectType: dbMatch.projectType || p.type,
        paymentPlanText: dbMatch.paymentPlanText || p.paymentPlan,
        sizeText: dbMatch.sizeText || p.size,
        roiText: dbMatch.roiText || p.roi,
        completionText: dbMatch.completionText || p.completion,
        coverImageUrl: dbMatch.coverImageUrl || null,
        media: dbMatch.media || []
      }
    }

    return {
      id: p.id,
      name: p.name,
      slug: slug,
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
  })

  return NextResponse.json(mergedProjects)
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
