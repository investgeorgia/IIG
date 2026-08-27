import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'
import { getCurrentUser } from '@/server/utils/auth'
import { safeErrorMessage } from '@/server/utils/errors'

export const runtime = 'nodejs'

// All MIME types accepted per media category
const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif', 'image/avif', 'image/heic', 'image/heif', 'image/bmp', 'image/tiff', 'image/x-icon', 'image/pjpeg', 'image/x-png',
  // Videos
  'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/mpeg',
  // PDFs
  'application/pdf',
  // Presentations
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Documents
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // Spreadsheets
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // Generic binary fallback if extension matches
  'application/octet-stream',
]

const ALLOWED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif', '.heic', '.heif', '.bmp', '.tiff', '.ico',
  '.mp4', '.webm', '.mov', '.avi', '.mpeg',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'
]

const EXTENSION_TO_MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
  '.bmp': 'image/bmp',
  '.tiff': 'image/tiff',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.mpeg': 'video/mpeg',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
}

/**
 * Returns the root directory for media storage.
 * - On Linux servers: uses MEDIA_STORAGE_PATH from .env
 * - On Windows/local dev: always uses public/uploads (served statically by Next.js)
 */
function getMediaRoot(): { dir: string; urlBase: string } {
  const envPath = process.env.MEDIA_STORAGE_PATH

  if (envPath) {
    return { dir: envPath, urlBase: '/media' }
  }

  // Local fallback if no env variable is set
  return {
    dir: path.join(/*turbopackIgnore: true*/ process.cwd(), 'public', 'uploads'),
    urlBase: '/uploads'
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const typeRaw = formData.get('type') as string || 'IMAGE'
    const projectIdRaw = formData.get('projectId') as string || 'general'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const ext = path.extname(file.name || '').toLowerCase()
    const rawType = file.type || ''
    const detectedMime = rawType || EXTENSION_TO_MIME[ext] || ''

    // Validation: File is allowed if either its MIME type is allowed or its extension is allowed
    const isMimeAllowed = (rawType && ALLOWED_MIME_TYPES.includes(rawType)) || (detectedMime && ALLOWED_MIME_TYPES.includes(detectedMime))
    const isExtAllowed = ALLOWED_EXTENSIONS.includes(ext)

    if (!isMimeAllowed && !isExtAllowed) {
      const displayType = rawType || ext || 'unknown'
      return NextResponse.json(
        { error: `File type not allowed: ${displayType}` },
        { status: 400 }
      )
    }

    // Max 50MB
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 400 })
    }

    // Sanitize parameters to prevent path traversal
    const type = typeRaw.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase() || 'image'
    const projectId = projectIdRaw.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase() || 'general'
    const folder = (formData.get('folder') as string || '').replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase()
    const slug = (formData.get('slug') as string || '').replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase()

    const { dir: mediaRoot, urlBase } = getMediaRoot()

    // Build directory: iigproject/<slug>/ if folder/slug specified, otherwise <type>/<projectId>/
    let subDir = ''
    if (folder === 'iigproject' || type === 'iigproject') {
      const targetSlug = slug || projectId
      subDir = path.join('iigproject', targetSlug)
    } else if (slug) {
      subDir = path.join('iigproject', slug)
    } else {
      subDir = path.join(type, projectId)
    }

    const uploadDir = path.join(mediaRoot, subDir)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generate safe filename
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
    const filePath = path.join(uploadDir, safeName)

    // Write file
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    // URL served statically
    const urlSubPath = subDir.replace(/\\/g, '/')
    const url = `${urlBase}/${urlSubPath}/${safeName}`

    return NextResponse.json({
      url,
      name: file.name,
      size: file.size,
      mimeType: detectedMime || rawType || 'application/octet-stream'
    }, { status: 201 })

  } catch (error: any) {
    console.error('[Upload Error]', error)
    return NextResponse.json({ error: safeErrorMessage(error) }, { status: 500 })
  }
}
