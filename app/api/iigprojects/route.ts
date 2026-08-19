import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { projectsData } from '@/app/iigprojects/data'

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

  const mergedProjects = projectsData.map(p => {
    const slug = p.images[0] ? p.images[0].split('/')[1] : p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const dbMatch = dbMap.get(String(p.id)) || dbMap.get(slug.toLowerCase()) || dbMap.get(p.name.toLowerCase())

    if (dbMatch) {
      let mediaUrls: string[] = dbMatch.media?.map((m: any) => m.url) || []
      if (mediaUrls.length === 0 && dbMatch.coverImageUrl) {
        mediaUrls = [dbMatch.coverImageUrl]
      }
      if (mediaUrls.length === 0) {
        mediaUrls = p.images.map(img => img.startsWith('/') ? img : `/${img}`)
      }

      return {
        id: dbMatch.id,
        name: dbMatch.name || p.name,
        slug: dbMatch.slug || slug,
        location: dbMatch.location || p.location || 'Georgia',
        startingPrice: dbMatch.startingPriceText || p.startingPrice,
        type: dbMatch.projectType || p.type,
        paymentPlan: dbMatch.paymentPlanText || p.paymentPlan,
        size: dbMatch.sizeText || p.size,
        roi: dbMatch.roiText || p.roi,
        completion: dbMatch.completionText || p.completion,
        images: mediaUrls,
        thumbnail: dbMatch.coverImageUrl || mediaUrls[0] || '',
        mediaDetails: (dbMatch.media || []).map((m: any) => ({
          url: m.url,
          type: m.type,
          name: m.name
        }))
      }
    }

    const fallbackImages = p.images.map(img => img.startsWith('/') ? img : `/${img}`)
    return {
      id: p.id,
      name: p.name,
      slug: slug,
      location: p.location,
      startingPrice: p.startingPrice,
      type: p.type,
      paymentPlan: p.paymentPlan,
      size: p.size,
      roi: p.roi,
      completion: p.completion,
      images: fallbackImages,
      thumbnail: p.thumbnail ? (p.thumbnail.startsWith('/') ? p.thumbnail : `/${p.thumbnail}`) : fallbackImages[0]
    }
  })

  return NextResponse.json(mergedProjects)
}
