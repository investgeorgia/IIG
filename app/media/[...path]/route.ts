import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'
import os from 'os'

export const runtime = 'nodejs'

function getContentType(ext: string) {
  const map: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  }
  return map[ext.toLowerCase()] || 'application/octet-stream'
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const pathArray = (await params).path
    const envPath = process.env.MEDIA_STORAGE_PATH
    
    // Determine where media is stored
    let baseDir = ''
    if (envPath) {
      baseDir = envPath
    } else {
      // Local dev fallback
      baseDir = path.join(process.cwd(), 'public', 'media')
    }

    const filePath = path.resolve(baseDir, ...pathArray)
    const resolvedBase = path.resolve(baseDir)

    // Security check to prevent directory traversal
    if (!filePath.startsWith(resolvedBase + path.sep) && filePath !== resolvedBase) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    if (!existsSync(filePath)) {
      return new NextResponse('Not Found', { status: 404 })
    }

    const fileBuffer = await readFile(filePath)
    const ext = path.extname(filePath)
    const contentType = getContentType(ext)

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Error serving media file:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
