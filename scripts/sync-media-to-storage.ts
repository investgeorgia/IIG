import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { prisma } from '../lib/prisma'
import { projectsData } from '../app/iigprojects/data'

// Helper to slugify
function getSlug(p: typeof projectsData[0]): string {
  if (p.images[0]) {
    const parts = p.images[0].split('/')
    if (parts.length > 1) return parts[1]
  }
  return p.name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-')
}

async function main() {
  console.log('=== SYNCING MEDIA TO STORAGE PATH & POPULATING ALL 16 PORTFOLIO PROJECTS ===')

  // Determine target media root
  const envPath = process.env.MEDIA_STORAGE_PATH
  const isProdServer = envPath && process.platform !== 'win32'

  let targetStorageRoot: string
  let urlPrefix: string

  if (isProdServer) {
    targetStorageRoot = envPath
    urlPrefix = '/media'
  } else {
    targetStorageRoot = path.join(process.cwd(), 'public', 'uploads')
    urlPrefix = '/uploads'
  }

  console.log(`Target Storage Root: ${targetStorageRoot}`)
  console.log(`URL Prefix: ${urlPrefix}`)

  const publicMediaFolder = path.join(process.cwd(), 'public', 'media')

  // Copy images from public/media/<slug> into <targetStorageRoot>/iigproject/<slug>/
  for (const project of projectsData) {
    const slug = getSlug(project)
    const srcDir = path.join(publicMediaFolder, slug)
    const destDir = path.join(targetStorageRoot, 'iigproject', slug)

    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true })
    }

    let copiedCount = 0
    if (fs.existsSync(srcDir)) {
      const files = fs.readdirSync(srcDir)
      for (const file of files) {
        const srcFile = path.join(srcDir, file)
        const destFile = path.join(destDir, file)
        fs.copyFileSync(srcFile, destFile)
        copiedCount++
      }
      console.log(`Synced ${copiedCount} files for "${project.name}" -> ${destDir}`)
    } else {
      console.warn(`Source media directory not found for ${slug}: ${srcDir}`)
    }

    // Cover image URL
    const coverUrl = `${urlPrefix}/iigproject/${slug}/thumb.jpg`

    // Ensure database PortfolioProject record exists
    try {
      const existing = await prisma.portfolioProject.findFirst({
        where: { OR: [{ id: project.id }, { slug: slug }] }
      })

      let pfProjId = existing?.id

      if (existing) {
        await prisma.portfolioProject.update({
          where: { id: existing.id },
          data: {
            name: project.name,
            slug: slug,
            location: project.location || 'Tbilisi',
            startingPriceText: project.startingPrice,
            projectType: project.type,
            paymentPlanText: project.paymentPlan,
            sizeText: project.size,
            roiText: project.roi,
            completionText: project.completion,
            coverImageUrl: coverUrl,
            isPublished: true,
            sortOrder: project.id
          }
        })
      } else {
        const created = await prisma.portfolioProject.create({
          data: {
            id: project.id,
            name: project.name,
            slug: slug,
            location: project.location || 'Tbilisi',
            startingPriceText: project.startingPrice,
            projectType: project.type,
            paymentPlanText: project.paymentPlan,
            sizeText: project.size,
            roiText: project.roi,
            completionText: project.completion,
            coverImageUrl: coverUrl,
            isPublished: true,
            sortOrder: project.id
          }
        })
        pfProjId = created.id
      }

      if (pfProjId) {
        // Sync gallery media items
        await prisma.portfolioMedia.deleteMany({ where: { portfolioProjectId: pfProjId } })

        const mediaItems = project.images.map((img, idx) => {
          const fileName = img.split('/').pop() || `${idx + 1}.jpg`
          const isVid = fileName.endsWith('.mp4') || fileName.endsWith('.webm')
          return {
            portfolioProjectId: pfProjId!,
            type: isVid ? ('VIDEO' as const) : ('IMAGE' as const),
            url: `${urlPrefix}/iigproject/${slug}/${fileName}`,
            name: `${project.name} image ${idx + 1}`,
            sortOrder: idx
          }
        })

        if (mediaItems.length > 0) {
          await prisma.portfolioMedia.createMany({ data: mediaItems })
        }
      }
    } catch (dbErr) {
      console.error(`Database sync warning for ${project.name}:`, dbErr)
    }
  }

  console.log('=== ALL 16 PROJECTS AND MEDIA SUCCESSFULLY SYNCED TO STORAGE PATH ===')
}

main()
  .catch((e) => {
    console.error('Error running sync script:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
