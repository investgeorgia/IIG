import fs from 'fs'
import path from 'path'

const STORE_PATH = path.join(process.cwd(), 'data', 'portfolio-store.json')

export interface StoredMedia {
  id: number
  portfolioProjectId: number
  type: 'IMAGE' | 'VIDEO'
  url: string
  name?: string
  size?: number
  mimeType?: string
  sortOrder: number
}

export function getStoredMedia(portfolioProjectId: number): StoredMedia[] {
  try {
    if (!fs.existsSync(STORE_PATH)) return []
    const raw = fs.readFileSync(STORE_PATH, 'utf-8')
    const data = JSON.parse(raw)
    return (data[portfolioProjectId] || []) as StoredMedia[]
  } catch {
    return []
  }
}

export function getAllStoredMediaMap(): Record<number, StoredMedia[]> {
  try {
    if (!fs.existsSync(STORE_PATH)) return {}
    const raw = fs.readFileSync(STORE_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export function addStoredMedia(media: StoredMedia): void {
  try {
    const dir = path.dirname(STORE_PATH)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    let data: Record<number, StoredMedia[]> = {}
    if (fs.existsSync(STORE_PATH)) {
      try {
        data = JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'))
      } catch {
        data = {}
      }
    }
    const list = data[media.portfolioProjectId] || []
    // Avoid duplicate URLs
    if (!list.some(m => m.id === media.id || m.url === media.url)) {
      list.push(media)
    }
    data[media.portfolioProjectId] = list
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8')
  } catch (e) {
    console.error('Failed to write stored media:', e)
  }
}

export function deleteStoredMedia(mediaId: number): void {
  try {
    if (!fs.existsSync(STORE_PATH)) return
    const data: Record<number, StoredMedia[]> = JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'))
    for (const projId in data) {
      data[projId] = data[projId].filter(m => m.id !== mediaId)
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8')
  } catch (e) {
    console.error('Failed to delete stored media:', e)
  }
}

export function bulkDeleteStoredMedia(mediaIds: number[]): void {
  try {
    if (!fs.existsSync(STORE_PATH)) return
    const data: Record<number, StoredMedia[]> = JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'))
    const set = new Set(mediaIds.map(id => Number(id)))
    for (const projId in data) {
      data[projId] = data[projId].filter(m => !set.has(Number(m.id)))
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8')
  } catch (e) {
    console.error('Failed to bulk delete stored media:', e)
  }
}

export function clearAllStoredMedia(): void {
  try {
    const dir = path.dirname(STORE_PATH)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(STORE_PATH, JSON.stringify({}, null, 2), 'utf-8')
  } catch (e) {
    console.error('Failed to clear stored media:', e)
  }
}

export function reorderStoredMedia(portfolioProjectId: number, items: { id: number; sortOrder: number }[]): void {
  try {
    if (!fs.existsSync(STORE_PATH)) return
    const data: Record<number, StoredMedia[]> = JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'))
    const list = data[portfolioProjectId]
    if (!list) return

    const map = new Map<number, number>()
    for (const item of items) {
      map.set(Number(item.id), item.sortOrder)
    }

    for (const m of list) {
      if (map.has(Number(m.id))) {
        m.sortOrder = map.get(Number(m.id))!
      }
    }

    list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    data[portfolioProjectId] = list
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8')
  } catch (e) {
    console.error('Failed to reorder stored media:', e)
  }
}

