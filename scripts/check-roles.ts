import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!)
const prisma = new PrismaClient({ adapter })

async function main() {
  const users = await prisma.user.findMany({
    include: { role: true },
    orderBy: { id: 'asc' }
  })
  console.log('Users and roles:')
  users.forEach(u => console.log(` - [${u.id}] ${u.name} | role: "${u.role.name}" | active: ${u.isActive}`))

  const roles = await prisma.role.findMany()
  console.log('\nAll roles in DB:')
  roles.forEach(r => console.log(` - [${r.id}] "${r.name}"`))
}

main().finally(() => prisma.$disconnect())
