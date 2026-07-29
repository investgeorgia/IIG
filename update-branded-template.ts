/**
 * Run with: npx tsx update-branded-template.ts
 * Updates the "Branded Template" in the DB with the fixed HTML from online_viewer_net.htm
 */
import { prisma } from './lib/prisma'
import { readFileSync } from 'fs'
import path from 'path'

async function main() {
  const htmlContent = readFileSync(
    path.join(process.cwd(), 'online_viewer_net.htm'),
    'utf-8'
  )

  const result = await prisma.proposalTemplate.updateMany({
    where: { name: 'Branded Template' },
    data: { content: htmlContent }
  })

  if (result.count === 0) {
    console.log('❌ "Branded Template" not found. Creating it...')
    await prisma.proposalTemplate.create({
      data: {
        name: 'Branded Template',
        content: htmlContent,
        isDefault: false
      }
    })
    console.log('✅ Branded Template created!')
  } else {
    console.log(`✅ Branded Template updated (${result.count} record)`)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
