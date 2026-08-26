import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { projectsData } from '@/app/iigprojects/data'
import { getStoredMedia, getAllStoredMediaMap } from '@/lib/portfolio-store'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

function getDiskImagesForSlug(slug: string): string[] {
  if (!slug) return []
  const cleanSlug = slug.toLowerCase().trim()
  const candidates = [
    path.join(process.cwd(), 'public', 'media', 'iigproject', cleanSlug),
    path.join(process.cwd(), 'public', 'uploads', 'iigproject', cleanSlug),
    path.join(process.cwd(), 'public', 'uploads', cleanSlug),
  ]

  for (const dir of candidates) {
    if (fs.existsSync(dir)) {
      try {
        const files = fs.readdirSync(dir)
          .filter(f => /\.(jpg|jpeg|png|webp|gif|svg|mp4|webm)$/i.test(f))
          .sort((a, b) => {
            const numA = parseInt(a, 10)
            const numB = parseInt(b, 10)
            if (!isNaN(numA) && !isNaN(numB)) return numA - numB
            return a.localeCompare(b)
          })
        if (files.length > 0) {
          const relBase = dir.includes(path.join('public', 'media')) ? '/media/iigproject/' + cleanSlug : '/uploads/iigproject/' + cleanSlug
          return files.map(f => `${relBase}/${f}`)
        }
      } catch {
        // ignore
      }
    }
  }
  return []
}

export async function GET() {
  let dbProjects: any[] = []
  try {
    dbProjects = await prisma.portfolioProject.findMany({
      where: {
        isPublished: true,
      },
      include: {
        media: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
      orderBy: {
        sortOrder: 'asc',
      },
    })
  } catch (error: any) {
    console.warn('[iigprojects DB GET Warning]', error?.message || error)
  }

  // Create a map of DB projects by ID / slug / name
  const dbMap = new Map<string, any>()
  for (const p of dbProjects) {
    dbMap.set(String(p.id), p)
    if (p.slug) dbMap.set(p.slug.toLowerCase(), p)
    if (p.name) dbMap.set(p.name.toLowerCase(), p)
  }

  const storedMap = getAllStoredMediaMap()
  const processedProjectIds = new Set<number>()

  const formatUrl = (url: string) => {
    if (!url) return ''
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    return url.startsWith('/') ? url : `/${url}`
  }

  const mergedProjects = projectsData.map((p, index) => {
    const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    const dbMatch = dbMap.get(String(p.id)) || dbMap.get(slug.toLowerCase()) || dbMap.get(p.name.toLowerCase())
    if (dbMatch) processedProjectIds.add(dbMatch.id)

    let storedItems = storedMap[p.id] || getStoredMedia(p.id) || []
    if (storedItems.length > 0) {
      storedItems = [...storedItems].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    }

    let mediaUrls: string[] = []
    let mediaDetails: any[] = []

    if (dbMatch && dbMatch.media && dbMatch.media.length > 0) {
      mediaUrls = dbMatch.media.map((m: any) => formatUrl(m.url))
      mediaDetails = dbMatch.media.map((m: any) => ({ url: formatUrl(m.url), type: m.type, name: m.name }))
    } else if (storedItems && storedItems.length > 0) {
      mediaUrls = storedItems.map(m => formatUrl(m.url))
      mediaDetails = storedItems.map(m => ({ url: formatUrl(m.url), type: m.type, name: m.name }))
    } else if (dbMatch && dbMatch.coverImageUrl) {
      mediaUrls = [formatUrl(dbMatch.coverImageUrl)]
      mediaDetails = [{ url: formatUrl(dbMatch.coverImageUrl), type: 'IMAGE', name: 'Cover Image' }]
    } else {
      const diskImgs = getDiskImagesForSlug(dbMatch?.slug || slug)
      mediaUrls = diskImgs.map(formatUrl)
      mediaDetails = diskImgs.map(url => ({
        url: formatUrl(url),
        type: url.endsWith('.mp4') || url.endsWith('.webm') ? 'VIDEO' : 'IMAGE',
        name: p.name
      }))
    }

    const coverUrl = formatUrl(dbMatch?.coverImageUrl || mediaUrls[0] || '')

    return {
      id: dbMatch?.id || p.id,
      name: dbMatch?.name || p.name,
      slug: dbMatch?.slug || slug,
      location: dbMatch?.location || p.location || 'Georgia',
      startingPrice: dbMatch?.startingPriceText || p.startingPrice,
      type: dbMatch?.projectType || p.type,
      paymentPlan: dbMatch?.paymentPlanText || p.paymentPlan,
      size: dbMatch?.sizeText || p.size,
      roi: dbMatch?.roiText || p.roi,
      completion: dbMatch?.completionText || p.completion,
      sortOrder: dbMatch?.sortOrder !== undefined && dbMatch?.sortOrder !== null ? dbMatch.sortOrder : index,
      images: mediaUrls,
      thumbnail: coverUrl,
      mediaDetails: mediaDetails
    }
  })

  // Append extra published DB projects not in static data
  for (const dbProj of dbProjects) {
    if (!processedProjectIds.has(dbProj.id)) {
      let mediaUrls = (dbProj.media || []).map((m: any) => formatUrl(m.url))
      let mediaDetails = (dbProj.media || []).map((m: any) => ({ url: formatUrl(m.url), type: m.type, name: m.name }))

      if (mediaUrls.length === 0 && dbProj.slug) {
        const diskImgs = getDiskImagesForSlug(dbProj.slug)
        if (diskImgs.length > 0) {
          mediaUrls = diskImgs.map(formatUrl)
          mediaDetails = diskImgs.map(url => ({
            url: formatUrl(url),
            type: url.endsWith('.mp4') || url.endsWith('.webm') ? 'VIDEO' : 'IMAGE',
            name: dbProj.name
          }))
        }
      }

      mergedProjects.push({
        id: dbProj.id,
        name: dbProj.name,
        slug: dbProj.slug,
        location: dbProj.location || 'Georgia',
        startingPrice: dbProj.startingPriceText || '$100,000',
        type: dbProj.projectType || 'Apartments',
        paymentPlan: dbProj.paymentPlanText || '-',
        size: dbProj.sizeText || 'From 50 m²',
        roi: dbProj.roiText || '10%',
        completion: dbProj.completionText || 'Q4 2026',
        sortOrder: dbProj.sortOrder ?? 999,
        images: mediaUrls,
        thumbnail: formatUrl(dbProj.coverImageUrl || mediaUrls[0] || ''),
        mediaDetails: mediaDetails
      })
    }
  }

  // Sort strictly by sortOrder ascending
  mergedProjects.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  return NextResponse.json(mergedProjects, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
  })
}
