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

  const mergedProjects = projectsData.map(p => {
    const slug = p.images[0] ? p.images[0].split('/')[1] : p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const dbMatch = dbMap.get(String(p.id)) || dbMap.get(slug.toLowerCase()) || dbMap.get(p.name.toLowerCase())
    const storedItems = storedMap[p.id] || getStoredMedia(p.id)

    let mediaUrls: string[] = []
    let mediaDetails: any[] = []

    if (dbMatch && dbMatch.media && dbMatch.media.length > 0) {
      mediaUrls = dbMatch.media.map((m: any) => m.url)
      mediaDetails = dbMatch.media.map((m: any) => ({ url: m.url, type: m.type, name: m.name }))
    } else if (storedItems && storedItems.length > 0) {
      mediaUrls = storedItems.map(m => m.url)
      mediaDetails = storedItems.map(m => ({ url: m.url, type: m.type, name: m.name }))
    }

    const coverUrl = dbMatch?.coverImageUrl || mediaUrls[0] || ''

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
      images: mediaUrls,
      thumbnail: coverUrl,
      mediaDetails: mediaDetails
    }
  })

  return NextResponse.json(mergedProjects)
}
