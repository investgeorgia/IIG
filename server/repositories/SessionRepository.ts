import { prisma } from '@/lib/prisma'
import { Session, Prisma } from '@prisma/client'

export class SessionRepository {
  static async create(data: Prisma.SessionCreateInput): Promise<Session> {
    return prisma.session.create({ data })
  }

  static async findByToken(token: string): Promise<Session | null> {
    return prisma.session.findUnique({ 
      where: { token },
      include: { user: { include: { role: { include: { permissions: true } } } } }
    })
  }

  static async deleteByToken(token: string): Promise<void> {
    await prisma.session.delete({ where: { token } }).catch(() => {})
  }

  static async deleteExpired(): Promise<void> {
    await prisma.session.deleteMany({
      where: { expiresAt: { lt: new Date() } }
    }).catch(() => {})
  }
}
