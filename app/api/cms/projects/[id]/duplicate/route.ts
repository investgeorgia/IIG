import { checkPermission, AccessLevel } from '@/server/utils/permissions'
import { getCurrentUser } from '@/server/utils/auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { safeErrorMessage } from '@/server/utils/errors'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!checkPermission(user, 'Projects', AccessLevel.EDIT)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const id = Number((await params).id)
    const original = await prisma.project.findUnique({
      where: { id },
      include: {
        amenities: true,
        paymentPlans: {
          where: { unitId: null }
        },
        media: true
      }
    })

    if (!original) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const newProject = await prisma.project.create({
      data: {
        name: `Copy of ${original.name}`,
        description: original.description,
        address: original.address,
        city: original.city,
        country: original.country,
        latitude: original.latitude,
        longitude: original.longitude,
        status: original.status,
        isPublished: false,
        completionDate: original.completionDate,
        startingPrice: original.startingPrice,
        roi: original.roi,
        coverImageUrl: original.coverImageUrl,
        developerId: original.developerId,
        amenities: {
          create: original.amenities.map(a => ({
            amenityId: a.amenityId
          }))
        },
        paymentPlans: {
          create: original.paymentPlans.map(p => ({
            name: p.name,
            description: p.description,
            schedule: p.schedule as any
          }))
        },
        media: {
          create: original.media.map(m => ({
            type: m.type,
            url: m.url,
            name: m.name,
            size: m.size,
            mimeType: m.mimeType,
            sortOrder: m.sortOrder
          }))
        }
      }
    })

    return NextResponse.json(newProject, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: safeErrorMessage(error) }, { status: 500 })
  }
}
