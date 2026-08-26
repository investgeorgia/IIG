import { NextResponse } from 'next/server'
import { projectsData, Project } from '@/app/iigprojects/data'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

function getDynamicProjects(): Project[] {
  const mediaDir = path.join(process.cwd(), 'public', 'media')
  if (!fs.existsSync(mediaDir)) return projectsData

  let diskFolders: string[] = []
  try {
    diskFolders = fs.readdirSync(mediaDir).filter(f => {
      const full = path.join(mediaDir, f)
      return fs.statSync(full).isDirectory() && f !== 'qr' && f !== 'iigproject'
    })
  } catch {
    return projectsData
  }

  // Preferred folder ordering
  const folderOrder = [
    "ortachala",
    "kavtaradze",
    "parallel",
    "cube",
    "lisi",
    "shindisi",
    "oval",
    "forest-beach",
    "krtsanisi-resort",
    "hisni",
    "sakeni",
    "gardani",
    "neo",
    "marina-club",
    "green-gardens",
    "oxy"
  ]

  diskFolders.sort((a, b) => {
    const idxA = folderOrder.indexOf(a.toLowerCase())
    const idxB = folderOrder.indexOf(b.toLowerCase())
    const posA = idxA !== -1 ? idxA : 999
    const posB = idxB !== -1 ? idxB : 999
    return posA - posB
  })

  // Map known project metadata
  const knownMetaMap = new Map<string, Project>()
  for (const p of projectsData) {
    const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    knownMetaMap.set(p.name.toLowerCase(), p)
    knownMetaMap.set(slug, p)
  }

  const result: Project[] = []

  for (const folder of diskFolders) {
    const dirPath = path.join(mediaDir, folder)
    let files: string[] = []
    try {
      files = fs.readdirSync(dirPath)
        .filter(file => /\.(jpg|jpeg|png|webp|gif|svg|mp4|webm)$/i.test(file))
        .sort((a, b) => {
          const matchA = a.match(/^(?:imgi_)?(\d+)/i)
          const matchB = b.match(/^(?:imgi_)?(\d+)/i)
          if (matchA && matchB) {
            const nA = parseInt(matchA[1], 10)
            const nB = parseInt(matchB[1], 10)
            if (nA !== nB) return nA - nB
          }
          return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
        })
    } catch {
      // ignore
    }

    const allImages = files.map(f => `/media/${folder}/${f}`)
    const nonThumbImages = files.filter(f => !f.toLowerCase().startsWith('thumb')).map(f => `/media/${folder}/${f}`)
    
    const thumbFile = files.find(f => f.toLowerCase().startsWith('thumb'))
    const key = folder.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const baseProj = knownMetaMap.get(folder.toLowerCase()) || knownMetaMap.get(key)

    const thumbnail = thumbFile 
      ? `/media/${folder}/${thumbFile}` 
      : (nonThumbImages[0] || allImages[0] || baseProj?.thumbnail || baseProj?.images?.[0] || '')

    const finalImages = nonThumbImages.length > 0 
      ? nonThumbImages 
      : (allImages.length > 0 ? allImages : baseProj?.images || [])

    if (baseProj) {
      result.push({
        ...baseProj,
        images: finalImages.length > 0 ? finalImages : baseProj.images,
        thumbnail: thumbnail || baseProj.thumbnail || (finalImages[0] || '')
      })
    } else {
      const name = folder.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      result.push({
        id: 100 + result.length,
        name,
        location: "Georgia",
        startingPrice: "$150,000",
        type: "1, 2 & 3 BR Apartments",
        paymentPlan: "20 / 80",
        size: "From 45 m²",
        roi: "12%",
        completion: "Q4 2027",
        images: finalImages,
        thumbnail: thumbnail || (finalImages[0] || '')
      })
    }
  }

  return result.length > 0 ? result : projectsData
}

export async function GET() {
  const projects = getDynamicProjects()
  return NextResponse.json(projects, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
  })
}
