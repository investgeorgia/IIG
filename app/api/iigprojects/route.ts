import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { projectsData } from '@/app/iigprojects/data'
import { getStoredMedia, getAllStoredMediaMap } from '@/lib/portfolio-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  let dbProjects: any[] = []
  try {
    dbProjects = await prisma.portfolioProject.findMany({
      where: {
        isPublished: true,
      },
      include: {
        media: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
      orderBy: {
        sortOrder: 'asc',
      },
    })
  } catch (error: any) {
    console.warn('[iigprojects DB GET Warning]', error?.message || error)
  }

  // Create a map of DB projects by ID / slug / name
  const dbMap = new Map<string, any>()
  for (const p of dbProjects) {
    dbMap.set(String(p.id), p)
    if (p.slug) dbMap.set(p.slug.toLowerCase(), p)
    if (p.name) dbMap.set(p.name.toLowerCase(), p)
  }

  const storedMap = getAllStoredMediaMap()

  const processedProjectIds = new Set<number>()

  const mergedProjects = projectsData.map((p, index) => {
    const slug = p.images[0] ? p.images[0].split('/')[1] : p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const dbMatch = dbMap.get(String(p.id)) || dbMap.get(slug.toLowerCase()) || dbMap.get(p.name.toLowerCase())
    if (dbMatch) processedProjectIds.add(dbMatch.id)

    let storedItems = storedMap[p.id] || getStoredMedia(p.id) || []
    if (storedItems.length > 0) {
      storedItems = [...storedItems].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    }

    let mediaUrls: string[] = []
    let mediaDetails: any[] = []

    if (dbMatch && dbMatch.media && dbMatch.media.length > 0) {
      mediaUrls = dbMatch.media.map((m: any) => m.url)
      mediaDetails = dbMatch.media.map((m: any) => ({ url: m.url, type: m.type, name: m.name }))
    } else if (storedItems && storedItems.length > 0) {
      mediaUrls = storedItems.map(m => m.url)
      mediaDetails = storedItems.map(m => ({ url: m.url, type: m.type, name: m.name }))
    } else {
      mediaUrls = p.images || []
    }

    const coverUrl = dbMatch?.coverImageUrl || mediaUrls[0] || p.thumbnail || ''

    return {
      id: dbMatch?.id || p.id,
      name: dbMatch?.name || p.name,
      slug: dbMatch?.slug || slug,
      location: dbMatch?.location || p.location || 'Georgia',
      startingPrice: dbMatch?.startingPriceText || p.startingPrice,
      type: dbMatch?.projectType || p.type,
      paymentPlan: dbMatch?.paymentPlanText || p.paymentPlan,
      size: dbMatch?.sizeText || p.size,
      roi: dbMatch?.roiText || p.roi,
      completion: dbMatch?.completionText || p.completion,
      sortOrder: dbMatch?.sortOrder !== undefined && dbMatch?.sortOrder !== null ? dbMatch.sortOrder : index,
      images: mediaUrls,
      thumbnail: coverUrl,
      mediaDetails: mediaDetails
    }
  })

  // Append extra published DB projects not in static data
  for (const dbProj of dbProjects) {
    if (!processedProjectIds.has(dbProj.id)) {
      const mediaUrls = (dbProj.media || []).map((m: any) => m.url)
      const mediaDetails = (dbProj.media || []).map((m: any) => ({ url: m.url, type: m.type, name: m.name }))
      mergedProjects.push({
        id: dbProj.id,
        name: dbProj.name,
        slug: dbProj.slug,
        location: dbProj.location || 'Georgia',
        startingPrice: dbProj.startingPriceText || '$100,000',
        type: dbProj.projectType || 'Apartments',
        paymentPlan: dbProj.paymentPlanText || '-',
        size: dbProj.sizeText || 'From 50 m²',
        roi: dbProj.roiText || '10%',
        completion: dbProj.completionText || 'Q4 2026',
        sortOrder: dbProj.sortOrder ?? 999,
        images: mediaUrls,
        thumbnail: dbProj.coverImageUrl || mediaUrls[0] || '',
        mediaDetails: mediaDetails
      })
    }
  }

  // Sort strictly by sortOrder ascending
  mergedProjects.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  return NextResponse.json(mergedProjects)
}
