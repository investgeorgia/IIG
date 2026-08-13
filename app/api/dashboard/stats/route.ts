import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/server/utils/auth'
import { isRestricted } from '@/server/utils/roles'
import { prisma } from '@/lib/prisma'
import { safeErrorMessage } from '@/server/utils/errors'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const isUserRestricted = isRestricted(user)
    const now = new Date()
    const last30Start = new Date(now)
    last30Start.setDate(last30Start.getDate() - 30)
    const prev30Start = new Date(now)
    prev30Start.setDate(prev30Start.getDate() - 60)

    const customerWhere = isUserRestricted ? { assignedToId: user.id } : {}
    const proposalWhere = isUserRestricted ? { createdById: user.id } : {}

    // Run queries sequentially over single connection to prevent pool contention
    const totalCustomers = await prisma.customer.count({ where: customerWhere })
    const newCustomersLast30 = await prisma.customer.count({ where: { ...customerWhere, createdAt: { gte: last30Start } } })
    const newCustomersPrev30 = await prisma.customer.count({ where: { ...customerWhere, createdAt: { gte: prev30Start, lt: last30Start } } })

    const totalProposals = await prisma.proposal.count({ where: proposalWhere })
    const newProposalsLast30 = await prisma.proposal.count({ where: { ...proposalWhere, createdAt: { gte: last30Start } } })
    const newProposalsPrev30 = await prisma.proposal.count({ where: { ...proposalWhere, createdAt: { gte: prev30Start, lt: last30Start } } })

    const activeProjects = await prisma.project.count({ where: { status: { in: ['PLANNING', 'UNDER_CONSTRUCTION'] } } })
    const newProjectsLast30 = await prisma.project.count({ where: { createdAt: { gte: last30Start } } })
    const newProjectsPrev30 = await prisma.project.count({ where: { createdAt: { gte: prev30Start, lt: last30Start } } })

    const totalUnits = await prisma.unit.count()
    const newUnitsLast30 = await prisma.unit.count({ where: { createdAt: { gte: last30Start } } })
    const newUnitsPrev30 = await prisma.unit.count({ where: { createdAt: { gte: prev30Start, lt: last30Start } } })

    const recentProposals = await prisma.proposal.findMany({
      where: proposalWhere,
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        customer: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
      },
    })

    function pctChange(current: number, previous: number) {
      if (previous === 0) return current > 0 ? 100 : 0
      return Math.round(((current - previous) / previous) * 100)
    }

    return NextResponse.json({
      customers: {
        total: totalCustomers,
        newLast30: newCustomersLast30,
        percentChange: pctChange(newCustomersLast30, newCustomersPrev30),
      },
      proposals: {
        total: totalProposals,
        newLast30: newProposalsLast30,
        percentChange: pctChange(newProposalsLast30, newProposalsPrev30),
      },
      projects: {
        active: activeProjects,
        newLast30: newProjectsLast30,
        percentChange: pctChange(newProjectsLast30, newProjectsPrev30),
      },
      units: {
        total: totalUnits,
        newLast30: newUnitsLast30,
        percentChange: pctChange(newUnitsLast30, newUnitsPrev30),
      },
      recentProposals,
    })
  } catch (error: any) {
    return NextResponse.json({ error: safeErrorMessage(error) }, { status: 500 })
  }
}