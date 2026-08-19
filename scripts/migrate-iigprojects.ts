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

function parseNumericPrice(priceStr?: string): number | null {
  if (!priceStr) return null
  const cleaned = priceStr.replace(/[^0-9.]/g, '')
  const val = parseFloat(cleaned)
  return isNaN(val) ? null : val
}

function parseNumericRoi(roiStr?: string): number | null {
  if (!roiStr) return null
  const cleaned = roiStr.replace(/[^0-9.]/g, '')
  const val = parseFloat(cleaned)
  return isNaN(val) ? null : val
}

async function main() {
  console.log('Starting /iigprojects migration and media transfer...')

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

  // 2. Ensure default Developer exists
  let developer = await prisma.developer.findFirst()

  if (!developer) {
    developer = await prisma.developer.create({
      data: {
        name: 'Invest Georgia',
        description: 'Official Developer for Invest Georgia projects'
      }
    })
  }

  console.log(`Using Developer: ID ${developer.id} (${developer.name})`)

  // 3. Migrate each project
  for (const p of projectsData) {
    const rawSlug = p.images[0] ? p.images[0].split('/')[1] : slugify(p.name)
    const slug = rawSlug || slugify(p.name)

    console.log(`\nMigrating project: ${p.name} (slug: ${slug})`)

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
        
        // Copy file
        fs.copyFileSync(srcFile, destFile)

        const fileUrl = `${urlBase}/iigproject/${slug}/${file}`
        migratedMediaUrls.push(fileUrl)
      }
      console.log(`Copied ${files.length} media files to ${targetDir}`)
    } else {
      console.warn(`Source folder not found: ${sourceDir}`)
    }

    const coverUrl = migratedMediaUrls.find(u => u.endsWith('thumb.jpg')) || migratedMediaUrls[0] || null

    // Upsert project in database
    const project = await prisma.project.upsert({
      where: { id: p.id },
      update: {
        name: p.name,
        slug: slug,
        address: p.location,
        city: p.location,
        startingPrice: parseNumericPrice(p.startingPrice),
        startingPriceText: p.startingPrice,
        projectType: p.type,
        paymentPlanText: p.paymentPlan,
        sizeText: p.size,
        roiText: p.roi,
        roi: parseNumericRoi(p.roi),
        completionText: p.completion,
        isPublished: true,
        coverImageUrl: coverUrl,
        developerId: developer.id
      },
      create: {
        id: p.id,
        name: p.name,
        slug: slug,
        address: p.location,
        city: p.location,
        startingPrice: parseNumericPrice(p.startingPrice),
        startingPriceText: p.startingPrice,
        projectType: p.type,
        paymentPlanText: p.paymentPlan,
        sizeText: p.size,
        roiText: p.roi,
        roi: parseNumericRoi(p.roi),
        completionText: p.completion,
        isPublished: true,
        coverImageUrl: coverUrl,
        developerId: developer.id
      }
    })

    // Update media gallery entries in database
    await prisma.media.deleteMany({
      where: { projectId: project.id }
    })

    const mediaToInsert = migratedMediaUrls
      .filter(u => !u.endsWith('thumb.jpg')) // keep gallery images/videos
      .map((url, idx) => {
        const isVideo = url.endsWith('.mp4') || url.endsWith('.webm')
        return {
          projectId: project.id,
          type: isVideo ? ('VIDEO' as const) : ('IMAGE' as const),
          url: url,
          name: `${project.name} asset ${idx + 1}`,
          sortOrder: idx
        }
      })

    if (mediaToInsert.length > 0) {
      await prisma.media.createMany({
        data: mediaToInsert
      })
    }

    console.log(`Project ${project.name} (ID ${project.id}) saved with ${mediaToInsert.length} media records.`)
  }

  console.log('\nMigration successfully completed!')
}

main()
  .catch((err) => {
    console.error('Migration error:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
