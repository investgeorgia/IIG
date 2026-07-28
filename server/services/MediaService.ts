import { MediaRepository } from '../repositories/MediaRepository'
import { Prisma } from '@prisma/client'
import path from 'path'
import fs from 'fs'
import os from 'os'

/**
 * Returns the root directory for media storage.
 * On Linux servers: uses MEDIA_STORAGE_PATH from .env
 * On Windows/local dev: always uses public/uploads
 */
function getMediaRoot(): string {
  const envPath = process.env.MEDIA_STORAGE_PATH
  const isWindows = os.platform() === 'win32'
  if (envPath && !isWindows) return envPath
  return path.join(/*turbopackIgnore: true*/ process.cwd(), 'public', 'uploads')
}

export class MediaService {
  static async getProjectMedia(projectId: number) {
    return MediaRepository.findByProject(projectId)
  }

  static async create(data: Prisma.MediaUncheckedCreateInput) {
    return MediaRepository.create(data)
  }

  static async delete(id: number, url?: string) {
    if (url) {
      let filePath: string | null = null

      if (url.startsWith('/media/')) {
        // Server path: /media/<type>/<projectId>/<filename>
        const relativePath = url.replace(/^\/media\//, '')
        filePath = path.join(getMediaRoot(), relativePath)
      } else if (url.startsWith('/uploads/')) {
        // Local/legacy path under public/uploads/
        filePath = path.join(process.cwd(), 'public', url)
      }

      if (filePath && fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath) } catch { /* ignore if file already gone */ }
      }
    }
    return MediaRepository.delete(id)
  }

  static async bulkDelete(ids: number[]) {
    // Load all media records first to get URLs
    const results: { id: number; success: boolean }[] = []
    for (const id of ids) {
      try {
        const media = await MediaRepository.findById(id)
        await this.delete(id, media?.url)
        results.push({ id, success: true })
      } catch {
        results.push({ id, success: false })
      }
    }
    return results
  }
}
