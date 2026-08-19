import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { prisma } from '../lib/prisma'
import { projectsData } from '../app/iigprojects/data'

// Slugify helper
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function main() {
  console.log('Starting /iigprojects Portfolio migration and media transfer...')

  // 1. Determine media root directory
  const envPath = process.env.MEDIA_STORAGE_PATH
  let mediaRoot: string
  let urlBase: string

  if (envPath && process.platform !== 'win32') {
    mediaRoot = envPath
    urlBase = '/media'
  } else {
    mediaRoot = path.join(process.cwd(), 'public', 'uploads')
    urlBase = '/uploads'
  }

  console.log(`Media root path: ${mediaRoot}`)
  console.log(`URL base: ${urlBase}`)

  // 2. Migrate each project into PortfolioProject & PortfolioMedia
  for (const p of projectsData) {
    const rawSlug = p.images[0] ? p.images[0].split('/')[1] : slugify(p.name)
    const slug = rawSlug || slugify(p.name)

    console.log(`\nMigrating Portfolio project: ${p.name} (slug: ${slug})`)

    const targetSubDir = path.join('iigproject', slug)
    const targetDir = path.join(mediaRoot, targetSubDir)

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true })
    }

    // Source dir in public/media/<slug>
    const sourceDir = path.join(process.cwd(), 'public', 'media', slug)

    const migratedMediaUrls: string[] = []

    if (fs.existsSync(sourceDir)) {
      const files = fs.readdirSync(sourceDir)
      for (const file of files) {
        const srcFile = path.join(sourceDir, file)
        const destFile = path.join(targetDir, file)
        
        // Copy file if not existing
        fs.copyFileSync(srcFile, destFile)

        const fileUrl = `${urlBase}/iigproject/${slug}/${file}`
        migratedMediaUrls.push(fileUrl)
      }
      console.log(`Copied ${files.length} media files to ${targetDir}`)
    } else {
      console.warn(`Source folder not found: ${sourceDir}`)
    }

    const coverUrl = migratedMediaUrls.find(u => u.endsWith('thumb.jpg')) || migratedMediaUrls[0] || `${urlBase}/iigproject/${slug}/thumb.jpg`

    // Upsert project in PortfolioProject table
    const portfolioProject = await prisma.portfolioProject.upsert({
      where: { id: p.id },
      update: {
        name: p.name,
        slug: slug,
        location: p.location || 'Tbilisi',
        startingPriceText: p.startingPrice,
        projectType: p.type,
        paymentPlanText: p.paymentPlan,
        sizeText: p.size,
        roiText: p.roi,
        completionText: p.completion,
        isPublished: true,
        coverImageUrl: coverUrl,
        sortOrder: p.id
      },
      create: {
        id: p.id,
        name: p.name,
        slug: slug,
        location: p.location || 'Tbilisi',
        startingPriceText: p.startingPrice,
        projectType: p.type,
        paymentPlanText: p.paymentPlan,
        sizeText: p.size,
        roiText: p.roi,
        completionText: p.completion,
        isPublished: true,
        coverImageUrl: coverUrl,
        sortOrder: p.id
      }
    })

    // Update media gallery entries in PortfolioMedia database table
    await prisma.portfolioMedia.deleteMany({
      where: { portfolioProjectId: portfolioProject.id }
    })

    const mediaToInsert = migratedMediaUrls
      .filter(u => !u.endsWith('thumb.jpg')) // keep gallery images/videos
      .map((url, idx) => {
        const isVideo = url.endsWith('.mp4') || url.endsWith('.webm')
        return {
          portfolioProjectId: portfolioProject.id,
          type: isVideo ? ('VIDEO' as const) : ('IMAGE' as const),
          url: url,
          name: `${portfolioProject.name} image ${idx + 1}`,
          sortOrder: idx
        }
      })

    if (mediaToInsert.length > 0) {
      await prisma.portfolioMedia.createMany({
        data: mediaToInsert
      })
    }

    console.log(`Portfolio Project "${portfolioProject.name}" (ID ${portfolioProject.id}) saved with ${mediaToInsert.length} media records. Specs: Price ${p.startingPrice}, Type ${p.type}, Payment Plan ${p.paymentPlan}, Size ${p.size}, ROI ${p.roi}, Completion ${p.completion}`)
  }

  console.log('\nPortfolio Migration successfully completed!')
}

main()
  .catch((err) => {
    console.error('Migration error:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
