import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const dbUrl = process.env.DATABASE_URL
if (!dbUrl) throw new Error('DATABASE_URL is not set')

const adapter = new PrismaMariaDb(dbUrl)
const prisma = new PrismaClient({ adapter })

const salespersons = [
  { name: 'Ivane Kurasbediani',           slug: 'ivane',    phone: '971542574715', email: 'ivane@investingeorgia.ae' },
  { name: 'Liza',                          slug: 'liza',     phone: '971542574717', email: 'liza@investingeorgia.ae' },
  { name: 'Lika Tsamalashvili',            slug: 'lika',     phone: '971542574719', email: 'lika@investingeorgia.ae' },
  { name: 'Tamer Raouf Fouad Abdelkader', slug: 'tamer',    phone: '971542574721', email: 'tamer@investingeorgia.ae' },
  { name: 'Bijesh Vijayan',               slug: 'bijesh',   phone: '971542574714', email: 'bijesh@investingeorgia.ae' },
  { name: 'Achraf',                        slug: 'achraf',   phone: '971542574720', email: 'achraf@investingeorgia.ae' },
  { name: 'Hajar',                         slug: 'hajar',    phone: '971564156060', email: 'hajar@investingeorgia.ae' },
  { name: 'Oyunsaikhan',                   slug: 'oyun',     phone: '971564156161', email: 'oyun@investingeorgia.ae' },
  { name: 'Mohamed Adel Mohamed Ali Gad', slug: 'adel',     phone: '971564160505', email: 'adel@investingeorgia.ae' },
  { name: 'Sana',                          slug: 'sana',     phone: '971564165151', email: 'sana@investingeorgia.ae' },
  { name: 'Admin',                         slug: 'admin-sp', phone: '971542570122', email: 'admin@investingeorgia.ae' },
  { name: 'Analyn Johnson',               slug: 'showroom', phone: '971542574716', email: 'showroom@investingeorgia.ae' },
  { name: 'Anton',                         slug: 'anton',    phone: '971542574718', email: 'admin02@investingeorgia.ae' },
]

async function main() {
  console.log('Seeding salespersons...\n')

  for (const sp of salespersons) {
    const result = await prisma.salesperson.upsert({
      where: { slug: sp.slug },
      update: {
        name: sp.name,
        phone: sp.phone,
        email: sp.email,
        active: true,
      },
      create: {
        name: sp.name,
        slug: sp.slug,
        phone: sp.phone,
        email: sp.email,
        active: true,
      },
    })
    console.log(`  ✓ ${result.name} — /iigprojects/ref/${result.slug}`)
  }

  console.log(`\nDone. ${salespersons.length} salespersons seeded.`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
