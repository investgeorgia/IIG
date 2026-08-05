import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export class UnitRepository {
  static async findAllByProjectId(projectId: number) {
    return prisma.unit.findMany({
      where: { projectId },
      include: { paymentPlans: true },
      orderBy: { unitNumber: 'asc' }
    })
  }

  static async findById(id: number) {
    return prisma.unit.findUnique({
      where: { id },
      include: { project: true }
    })
  }

  static async create(data: Prisma.UnitUncheckedCreateInput) {
    return prisma.unit.create({ data })
  }

  static async update(id: number, data: Prisma.UnitUncheckedUpdateInput) {
    return prisma.unit.update({ where: { id }, data })
  }

  static async delete(id: number) {
    return prisma.unit.delete({ where: { id } })
  }
}
