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
  'image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif',
  // Videos
  'video/mp4', 'video/webm', 'video/quicktime',
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
]

const ALLOWED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg',
  '.mp4', '.webm', '.mov',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'
]

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

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `File type not allowed: ${file.type}` },
        { status: 400 }
      )
    }

    // Validate file extension
    const ext = path.extname(file.name).toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: `File extension not allowed: ${ext}` },
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
      mimeType: file.type
    }, { status: 201 })

  } catch (error: any) {
    console.error('[Upload Error]', error)
    return NextResponse.json({ error: safeErrorMessage(error) }, { status: 500 })
  }
}
