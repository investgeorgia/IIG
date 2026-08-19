import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    const formattedProjects = projects.map(p => {
      // Build media array: use media table entries, or fallback to coverImageUrl
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
          type: m.type, // 'IMAGE' or 'VIDEO'
          name: m.name
        }))
      }
    })

    return NextResponse.json(formattedProjects)
  } catch (error: any) {
    console.error('[iigprojects API Error]', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}
