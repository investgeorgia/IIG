import dotenv from 'dotenv'
dotenv.config()
import { AmenityCategory } from '@prisma/client'

const amenitiesToInsert = [
  { name: 'Spacious landscaped courtyard', category: AmenityCategory.RECREATION },
  { name: 'Sports courts', category: AmenityCategory.RECREATION },
  { name: 'Basketball court', category: AmenityCategory.RECREATION },
  { name: 'Tennis court', category: AmenityCategory.RECREATION },
  { name: 'Football field', category: AmenityCategory.RECREATION },
  { name: 'Children’s playgrounds', category: AmenityCategory.RECREATION },
  { name: 'Children’s room', category: AmenityCategory.RECREATION },
  { name: 'Recreational area', category: AmenityCategory.RECREATION },
  { name: 'Bike parking', category: AmenityCategory.TRANSPORT },
  { name: 'Bike paths', category: AmenityCategory.TRANSPORT },
  { name: 'Underground parking', category: AmenityCategory.TRANSPORT },
  { name: '24/7 security and video surveillance', category: AmenityCategory.SECURITY },
  { name: 'High-speed elevators', category: AmenityCategory.CONNECTIVITY },
  { name: 'Designer lobbies', category: AmenityCategory.OTHER },
  { name: 'Concierge services', category: AmenityCategory.OTHER },
  { name: 'Multi-level lighting systems', category: AmenityCategory.OTHER },
  { name: 'Nearby park', category: AmenityCategory.RECREATION },
  { name: 'Landscaped grounds and public gardens', category: AmenityCategory.RECREATION },
  { name: 'In-house infrastructure', category: AmenityCategory.OTHER },
  { name: 'Indoor swimming pool', category: AmenityCategory.WELLNESS },
  { name: 'Outdoor rooftop swimming pool', category: AmenityCategory.WELLNESS },
  { name: 'Spa', category: AmenityCategory.WELLNESS },
  { name: 'Wellness and relaxation area', category: AmenityCategory.WELLNESS },
  { name: 'Fitness center / gym', category: AmenityCategory.WELLNESS },
  { name: 'Ski rental and ski equipment storage', category: AmenityCategory.RECREATION },
  { name: 'Conference hall', category: AmenityCategory.OTHER },
  { name: 'Beauty salon', category: AmenityCategory.WELLNESS },
  { name: 'Restaurant', category: AmenityCategory.OTHER },
  { name: 'Restaurant with terrace', category: AmenityCategory.OTHER },
  { name: 'Hypermarket', category: AmenityCategory.RETAIL },
  { name: 'Branded shops', category: AmenityCategory.RETAIL },
  { name: 'Commercial areas', category: AmenityCategory.RETAIL },
  { name: 'A-class office spaces', category: AmenityCategory.OTHER },
  { name: 'Ballroom spaces', category: AmenityCategory.OTHER },
  { name: 'Bowling', category: AmenityCategory.RECREATION },
  { name: 'Billiards', category: AmenityCategory.RECREATION },
  { name: 'Mini golf course', category: AmenityCategory.RECREATION },
  { name: 'High ceilings', category: AmenityCategory.OTHER },
  { name: 'Panoramic views', category: AmenityCategory.OTHER },
  { name: 'Smart, modern layouts', category: AmenityCategory.OTHER },
  { name: 'Floor-to-ceiling panoramic windows', category: AmenityCategory.OTHER },
  { name: 'Fully connected utilities', category: AmenityCategory.CONNECTIVITY },
  { name: 'European-style layouts', category: AmenityCategory.OTHER },
  { name: 'Stylish architecture', category: AmenityCategory.OTHER },
  { name: 'Eco-friendly surroundings', category: AmenityCategory.OTHER }
]

async function main() {
  const { prisma } = await import('../lib/prisma')
  console.log('Inserting/upserting amenities...')
  for (const item of amenitiesToInsert) {
    const res = await prisma.amenity.upsert({
      where: { name: item.name },
      update: { category: item.category },
      create: { name: item.name, category: item.category }
    })
    console.log(`Saved: ${res.name} (${res.category})`)
  }
  console.log('All amenities saved successfully!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    const { prisma } = await import('../lib/prisma')
    await prisma.$disconnect()
  })
