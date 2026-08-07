import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

const userData = [
  { name: 'Ivane Kurasbediani', roleName: 'Sales', email: 'Ivane@investingeorgia.ae', phone: '+971 54 257 4715', password: 'Q7mL2xPa' },
  { name: 'Liza', roleName: 'Sales', email: 'liza@investingeorgia.ae', phone: '+971 54 257 4717', password: 'N4vR8kTw' },
  { name: 'Lika Tsamalashvili', roleName: 'Sales', email: 'lika@investingeorgia.ae', phone: '+971 54 257 4719', password: 'B9pX5eHs' },
  { name: 'Tamer Raouf Fouad Abdelkader', roleName: 'Sales', email: 'Tamer@investingeorgia.ae', phone: '+971 54 257 4721', password: 'Y3nJ7qMf' },
  { name: 'Bijesh Vijayan', roleName: 'Sales', email: 'Bijesh@investingeorgia.ae', phone: '+971 54 257 4714', password: 'D6rW1zKu' },
  { name: 'Achraf', roleName: 'Sales', email: 'achraf@investingeorgia.ae', phone: '+971 54 257 4720', password: 'F8hP4cNx' },
  { name: 'Hajar', roleName: 'Sales', email: 'hajar@investingeorgia.ae', phone: '+971 56 415 6060', password: 'T2mV9aQe' },
  { name: 'Oyunsaikhan', roleName: 'Sales', email: 'Oyun@investingeorgia.ae', phone: '+971 56 415 6161', password: 'K5xL7pRw' },
  { name: 'Mohamed Adel Mohamed Ali Gad', roleName: 'Sales', email: 'Adel@investingeorgia.ae', phone: '+971 56 416 0505', password: 'R4dY8nCs' },
  { name: 'Sana', roleName: 'Sales', email: 'sana@investingeorgia.ae', phone: '+971 56 416 5151', password: 'W1qH6tMz' },
  { name: 'Analyn Johnson', roleName: 'Sales', email: 'showroom@investingeorgia.ae', phone: '+971 54 257 4716', password: 'L9sN2bFa' },
  { name: 'Anton', roleName: 'Sales', email: 'admin02@investingeorgia.ae', phone: '+971 54 257 4718', password: 'J5uQ8mYr' },
  { name: 'Gia Dumbadze', roleName: 'Admin', email: 'Gia@investingeorgia.ae', phone: '+971 58 522 1777', password: 'V8eK1rXu' },
  { name: 'Mehak Anees', roleName: 'Admin', email: 'Mehak@investingeorgia.ae', phone: '+971 58 521 4663', password: 'X6nF4qBt' },
  { name: 'Sivasankaran Krishnaraj', roleName: 'Sales', email: 'Kris@investingeorgia.ae', phone: '+971 58 565 4110', password: 'G7wJ3hPv' },
  { name: 'Anisha', roleName: 'Sales', email: 'anisha@investingeorgia.ae', phone: '', password: 'U9cP2fWy' }
]

async function main() {
  console.log('Seeding users within workspace context...')
  
  const roles = await prisma.role.findMany()
  const roleMap = new Map(roles.map(r => [r.name.toLowerCase(), r.id]))

  for (const user of userData) {
    const roleId = roleMap.get(user.roleName.toLowerCase())
    if (!roleId) {
      console.error(`Role not found: ${user.roleName}`)
      continue
    }

    const hashedPassword = await bcrypt.hash(user.password, 10)

    const createdUser = await prisma.user.upsert({
      where: { email: user.email.toLowerCase() },
      update: {
        name: user.name,
        phone: user.phone || null,
        password: hashedPassword,
        roleId: roleId
      },
      create: {
        name: user.name,
        email: user.email.toLowerCase(),
        phone: user.phone || null,
        password: hashedPassword,
        roleId: roleId
      }
    })

    console.log(`Upserted user: ${createdUser.email} (ID: ${createdUser.id})`)

    // Set permission overrides
    await prisma.userModuleAccess.deleteMany({ where: { userId: createdUser.id } })

    const modulesToOverride = ['Amenities', 'Customers', 'Developers', 'Media', 'PaymentPlans', 'Projects', 'Units']

    if (user.roleName === 'Admin') {
      const allModules = [...modulesToOverride, 'Settings', 'Templates', 'Users', 'Pages']
      await prisma.userModuleAccess.createMany({
        data: allModules.map(moduleName => ({
          userId: createdUser.id,
          moduleName,
          accessLevel: 'EDIT'
        }))
      })
    } else if (user.roleName === 'Sales') {
      await prisma.userModuleAccess.createMany({
        data: modulesToOverride.map(moduleName => ({
          userId: createdUser.id,
          moduleName,
          accessLevel: 'EDIT'
        }))
      })
    }
  }

  console.log('User seeding finished successfully!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
