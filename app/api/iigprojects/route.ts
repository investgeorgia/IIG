import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { projectsData } from '@/app/iigprojects/data'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const projects = await prisma.portfolioProject.findMany({
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

    if (projects && projects.length > 0) {
      const formattedProjects = projects.map(p => {
        let mediaUrls: string[] = p.media.map(m => m.url)
        if (mediaUrls.length === 0 && p.coverImageUrl) {
          mediaUrls = [p.coverImageUrl]
        }

        return {
          id: p.id,
          name: p.name,
          slug: p.slug || `project-${p.id}`,
          location: p.location || 'Georgia',
          startingPrice: p.startingPriceText || '-',
          type: p.projectType || 'Apartments',
          paymentPlan: p.paymentPlanText || '-',
          size: p.sizeText || '-',
          roi: p.roiText || '-',
          completion: p.completionText || '-',
          images: mediaUrls,
          thumbnail: p.coverImageUrl || mediaUrls[0] || '',
          mediaDetails: p.media.map(m => ({
            url: m.url,
            type: m.type,
            name: m.name
          }))
        }
      })

      return NextResponse.json(formattedProjects)
    }
  } catch (error: any) {
    console.error('[iigprojects API Error]', error)
  }

  // Fallback to static projectsData
  const fallback = projectsData.map(p => ({
    id: p.id,
    name: p.name,
    slug: p.images[0] ? p.images[0].split('/')[1] : p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    location: p.location,
    startingPrice: p.startingPrice,
    type: p.type,
    paymentPlan: p.paymentPlan,
    size: p.size,
    roi: p.roi,
    completion: p.completion,
    images: p.images.map(img => img.startsWith('/') ? img : `/${img}`),
    thumbnail: p.thumbnail ? (p.thumbnail.startsWith('/') ? p.thumbnail : `/${p.thumbnail}`) : (p.images[0] ? (p.images[0].startsWith('/') ? p.images[0] : `/${p.images[0]}`) : '')
  }))

  return NextResponse.json(fallback)
}
