import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
  adapter?: PrismaMariaDb
}

function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) throw new Error('DATABASE_URL environment variable is not set')

  if (!globalForPrisma.adapter) {
    try {
      const cleanUrl = dbUrl.split('?')[0]
      const url = new URL(cleanUrl)
      globalForPrisma.adapter = new PrismaMariaDb({
        host: url.hostname,
        port: url.port ? Number(url.port) : 3306,
        user: url.username,
        password: url.password,
        database: url.pathname.replace(/^\//, ''),
        connectionLimit: 15,
        acquireTimeout: 30000,
        connectTimeout: 30000,
      })
    } catch {
      globalForPrisma.adapter = new PrismaMariaDb(dbUrl)
    }
  }

  return new PrismaClient({ adapter: globalForPrisma.adapter })
}

export const prisma = globalForPrisma.prisma ?? (globalForPrisma.prisma = createPrismaClient())

export function getPrisma(): PrismaClient {
  return prisma
}
