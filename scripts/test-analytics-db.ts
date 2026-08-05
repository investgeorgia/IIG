import 'dotenv/config'
import { prisma } from '../lib/prisma'

async function main() {
  try {
    console.log('Testing Prisma models...')
    const visitorCount = await prisma.referralVisitor.count()
    const eventCount = await prisma.referralTrackingEvent.count()
    console.log(`ReferralVisitor count: ${visitorCount}`)
    console.log(`ReferralTrackingEvent count: ${eventCount}`)
    
    const salespersons = await prisma.salesperson.findMany({
      where: { active: true },
      select: { id: true, name: true, slug: true },
    })
    console.log(`Found ${salespersons.length} active salespersons`)
  } catch (err: any) {
    console.error('Prisma query failed:', err.message, err.stack)
  }
}

main().catch(console.error)
