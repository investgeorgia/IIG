import 'dotenv/config'
import { prisma } from '../lib/prisma'

async function main() {
  console.log('=== CLEARING PORTFOLIO MEDIA RECORDS ===')

  // 1. Delete all PortfolioMedia records
  const deletedMedia = await prisma.portfolioMedia.deleteMany({})
  console.log(`Deleted ${deletedMedia.count} PortfolioMedia records.`)

  // 2. Reset coverImageUrl on all PortfolioProject records
  await prisma.portfolioProject.updateMany({
    data: {
      coverImageUrl: null
    }
  })
  console.log('Reset coverImageUrl to null on all PortfolioProject records.')

  console.log('=== PORTFOLIO MEDIA CLEARED SUCCESSFULLY ===')
}

main()
  .catch((e) => {
    console.error('Error clearing portfolio media:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
