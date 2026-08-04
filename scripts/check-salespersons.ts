import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!)
const prisma = new PrismaClient({ adapter })

async function main() {
  const rows = await prisma.salesperson.findMany({ orderBy: { createdAt: 'desc' } })
  console.log('Total salespersons in DB:', rows.length)
  rows.forEach(s => console.log(` - [${s.id}] ${s.name} | slug: ${s.slug} | active: ${s.active}`))
}

main().finally(() => prisma.$disconnect())
