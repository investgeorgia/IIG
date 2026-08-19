import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
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
        id: 'asc',
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
        location: p.city || p.address || 'Georgia',
        startingPrice: p.startingPriceText || (p.startingPrice ? `$${Number(p.startingPrice).toLocaleString()}` : '-'),
        type: p.projectType || 'Apartments',
        paymentPlan: p.paymentPlanText || '-',
        size: p.sizeText || '-',
        roi: p.roiText || (p.roi ? `${p.roi}%` : '-'),
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
