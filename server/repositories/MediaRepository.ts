import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export class MediaRepository {
  static async findByProject(projectId: number) {
    return prisma.media.findMany({
      where: { projectId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
    })
  }

  static async create(data: Prisma.MediaUncheckedCreateInput) {
    return prisma.media.create({ data })
  }

  static async findById(id: number) {
    return prisma.media.findUnique({ where: { id } })
  }

  static async delete(id: number) {
    return prisma.media.delete({ where: { id } })
  }

  static async updateOrder(id: number, sortOrder: number) {
    return prisma.media.update({ where: { id }, data: { sortOrder } })
  }
}
