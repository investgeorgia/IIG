import { MediaRepository } from '../repositories/MediaRepository'
import { Prisma } from '@prisma/client'
import path from 'path'
import fs from 'fs'

/**
 * Returns the root directory for media storage.
 * Uses MEDIA_STORAGE_PATH from .env on the server, falls back to public/media for local dev.
 */
function getMediaRoot(): string {
  const envPath = process.env.MEDIA_STORAGE_PATH
  if (envPath) return envPath
  return path.join(process.cwd(), 'public', 'media')
}

export class MediaService {
  static async getProjectMedia(projectId: number) {
    return MediaRepository.findByProject(projectId)
  }

  static async create(data: Prisma.MediaUncheckedCreateInput) {
    return MediaRepository.create(data)
  }

  static async delete(id: number, url?: string) {
    // Delete physical file if it's a local upload
    if (url) {
      let filePath: string | null = null

      if (url.startsWith('/media/')) {
        // New-style path: /media/<type>/<projectId>/<filename>
        const relativePath = url.replace(/^\/media\//, '')
        filePath = path.join(getMediaRoot(), relativePath)
      } else if (url.startsWith('/uploads/')) {
        // Legacy path: /uploads/<type>/<projectId>/<filename>
        filePath = path.join(process.cwd(), 'public', url)
      }

      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
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
