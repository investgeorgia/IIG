import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'
import os from 'os'

export const runtime = 'nodejs'

// All MIME types accepted per media category
const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif',
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

/**
 * Returns the root directory for media storage.
 * - On Linux servers: uses MEDIA_STORAGE_PATH from .env
 * - On Windows/local dev: always uses public/uploads (served statically by Next.js)
 */
function getMediaRoot(): { dir: string; urlBase: string } {
  const envPath = process.env.MEDIA_STORAGE_PATH
  const isWindows = os.platform() === 'win32'

  // Use env path only on Linux (production server)
  if (envPath && !isWindows) {
    return { dir: envPath, urlBase: '/media' }
  }

  // Local development: serve from public/uploads (Next.js static serving)
  return {
    dir: path.join(/*turbopackIgnore: true*/ process.cwd(), 'public', 'uploads'),
    urlBase: '/uploads'
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string || 'IMAGE'
    const projectId = formData.get('projectId') as string

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

    // Max 50MB
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 400 })
    }

    const { dir: mediaRoot, urlBase } = getMediaRoot()

    // Build directory: <mediaRoot>/<type>/<projectId>/
    const subDir = path.join(type.toLowerCase(), projectId || 'general')
    const uploadDir = path.join(mediaRoot, subDir)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generate safe filename
    const ext = path.extname(file.name)
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
    const filePath = path.join(uploadDir, safeName)

    // Write file
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    // URL served statically
    const url = `${urlBase}/${type.toLowerCase()}/${projectId || 'general'}/${safeName}`

    return NextResponse.json({
      url,
      name: file.name,
      size: file.size,
      mimeType: file.type
    }, { status: 201 })

  } catch (error: any) {
    console.error('[Upload Error]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
