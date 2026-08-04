import { createHash } from 'crypto'
import { prisma } from '@/lib/prisma'
import { TrackingEventType } from '@prisma/client'

// Known bot/crawler user-agent substrings
const BOT_PATTERNS = [
  'bot', 'crawl', 'spider', 'slurp', 'fetch', 'ia_archiver',
  'facebookexternalhit', 'twitterbot', 'linkedinbot', 'whatsapp',
  'googlebot', 'bingbot', 'yandex', 'baidu', 'duckduck',
  'semrush', 'ahrefs', 'mj12bot', 'dotbot',
]

export class TrackingService {

  /** Detect if a user-agent belongs to a bot or crawler */
  static isBot(userAgent: string): boolean {
    if (!userAgent) return false
    const ua = userAgent.toLowerCase()
    return BOT_PATTERNS.some(p => ua.includes(p))
  }

  /**
   * Build a deterministic visitor fingerprint.
   * SHA256 hash of IP + UserAgent (first 200 chars to cap length).
   */
  static buildVisitorId(ip: string, userAgent: string): string {
    const raw = `${ip}::${userAgent.slice(0, 200)}`
    return createHash('sha256').update(raw).digest('hex')
  }

  /** Coarse device detection from UA string */
  static detectDevice(userAgent: string): string {
    const ua = userAgent.toLowerCase()
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) return 'mobile'
    if (ua.includes('tablet') || ua.includes('ipad')) return 'tablet'
    return 'desktop'
  }

  /** Coarse browser detection from UA string */
  static detectBrowser(userAgent: string): string {
    const ua = userAgent.toLowerCase()
    if (ua.includes('edg/') || ua.includes('edge/')) return 'Edge'
    if (ua.includes('chrome') && !ua.includes('chromium')) return 'Chrome'
    if (ua.includes('firefox')) return 'Firefox'
    if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari'
    if (ua.includes('opera') || ua.includes('opr/')) return 'Opera'
    return 'Other'
  }

  /**
   * Upsert a visitor record.
   * - First visit: creates the row.
   * - Repeat visit: just bumps lastSeen (handled by @updatedAt).
   */
  static async upsertVisitor(
    visitorId: string,
    ipAddress: string,
    userAgent: string,
    device: string,
    browser: string,
  ): Promise<void> {
    await prisma.referralVisitor.upsert({
      where: { visitorId },
      create: { visitorId, ipAddress, userAgent, device, browser },
      update: { lastSeen: new Date() },
    })
  }

  /**
   * Write a tracking event row.
   * All fields except salespersonId/visitorId/eventType are optional.
   */
  static async logEvent(
    salespersonId: number,
    visitorId: string,
    eventType: TrackingEventType,
    utmSource?: string,
    utmMedium?: string,
    utmCampaign?: string,
    referrerUrl?: string,
  ): Promise<void> {
    await prisma.referralTrackingEvent.create({
      data: {
        salespersonId,
        visitorId,
        eventType,
        utmSource:   utmSource   || null,
        utmMedium:   utmMedium   || null,
        utmCampaign: utmCampaign || null,
        referrerUrl: referrerUrl || null,
      },
    })
  }

  /**
   * Extract the real IP from common proxy headers.
   * Returns '0.0.0.0' if nothing found.
   */
  static extractIp(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for')
    if (forwarded) return forwarded.split(',')[0].trim()
    return request.headers.get('x-real-ip') ?? '0.0.0.0'
  }
}
