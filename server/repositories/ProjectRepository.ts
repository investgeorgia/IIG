import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export class ProjectRepository {
  static async findAll() {
    return prisma.project.findMany({
      include: { developer: true, paymentPlans: true },
      orderBy: { createdAt: 'desc' }
    })
  }

  static async findById(id: number) {
    return prisma.project.findUnique({
      where: { id },
      include: { developer: true }
    })
  }

  static async create(data: Prisma.ProjectUncheckedCreateInput) {
    return prisma.project.create({ data })
  }

  static async update(id: number, data: Prisma.ProjectUncheckedUpdateInput) {
    return prisma.project.update({ where: { id }, data })
  }

  static async delete(id: number) {
    return prisma.project.delete({ where: { id } })
  }
}
