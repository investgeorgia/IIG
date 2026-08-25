import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/server/utils/auth'
import { checkPermission, AccessLevel } from '@/server/utils/permissions'
import { safeErrorMessage } from '@/server/utils/errors'

export async function PUT(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!checkPermission(user, 'ProjectPortfolio', AccessLevel.EDIT)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { items } = await request.json()

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid items array' }, { status: 400 })
    }

    const { projectsData } = await import('@/app/iigprojects/data')

    await Promise.all(
      items.map((item: { id: number; sortOrder: number }) => {
        const idNum = Number(item.id)
        const staticP = projectsData.find(x => x.id === idNum)
        const name = staticP?.name || `Project ${idNum}`
        const slug = staticP?.images[0] ? staticP.images[0].split('/')[1] : name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

        return prisma.portfolioProject.upsert({
          where: { id: idNum },
          update: { sortOrder: Number(item.sortOrder) },
          create: {
            id: idNum,
            name: name,
            slug: slug,
            startingPriceText: staticP?.startingPrice || '$100,000',
            projectType: staticP?.type || 'Apartments',
            paymentPlanText: staticP?.paymentPlan || '-',
            sizeText: staticP?.size || 'From 50 m²',
            roiText: staticP?.roi || '10%',
            completionText: staticP?.completion || 'Q4 2026',
            sortOrder: Number(item.sortOrder)
          }
        })
      })
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: safeErrorMessage(error) }, { status: 500 })
  }
}
