import { NextResponse } from 'next/server'
import { ProposalService } from '@/server/services/ProposalService'
import { buildProposalHtml } from '@/server/services/ProposalHtmlBuilder'
import path from 'path'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'

export const runtime = 'nodejs'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let browser = null
  const idStr = (await params).id
  const id = Number(idStr)
  const fallbackUrl = `/proposals/${id}/template?print=true`

  try {
    const proposal = await ProposalService.getById(id)
    if (!proposal) return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })

    const host = request.headers.get('host') || 'localhost:3000'
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const baseUrl = `${protocol}://${host}`

    // Build fully-rendered HTML (inlines logo, substitutes all placeholders, appends gallery)
    const html = buildProposalHtml(proposal, baseUrl)

    // Dynamic import of puppeteer to prevent top-level module load crashes on restricted servers
    let puppeteer: any
    try {
      puppeteer = (await import('puppeteer')).default
    } catch (e: any) {
      console.warn('[PDF Route] Puppeteer module load failed, returning print template:', e.message)
      return NextResponse.json({ pdfUrl: fallbackUrl })
    }

    // Discover system chromium/chrome if PUPPETEER_EXECUTABLE_PATH is not set
    let executablePath = process.env.PUPPETEER_EXECUTABLE_PATH
    if (!executablePath) {
      const possiblePaths = [
        '/usr/bin/google-chrome-stable',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
        '/snap/bin/chromium',
        '/usr/bin/chromium-freeworld',
      ]
      for (const p of possiblePaths) {
        if (existsSync(p)) {
          executablePath = p
          break
        }
      }
    }

    const launchOptions: any = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process'
      ]
    }

    if (executablePath) {
      launchOptions.executablePath = executablePath
    }

    try {
      browser = await puppeteer.launch(launchOptions)
    } catch (launchErr: any) {
      console.warn('[PDF Route] Puppeteer browser launch failed:', launchErr.message)
      return NextResponse.json({ pdfUrl: fallbackUrl })
    }

    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'load', timeout: 30000 })

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' }
    })

    const envPath = process.env.MEDIA_STORAGE_PATH
    let baseDir = path.join(process.cwd(), 'public', 'media')
    if (envPath) {
      try {
        const parent = path.dirname(envPath)
        if (existsSync(parent)) baseDir = envPath
      } catch {}
    }

    const userFolder = proposal.createdById ? `user-${proposal.createdById}` : 'user-general'
    const pdfDir = path.join(baseDir, 'proposals', userFolder)

    if (!existsSync(pdfDir)) await mkdir(pdfDir, { recursive: true })
    const filename = `proposal-${id}-${Date.now()}.pdf`
    await writeFile(path.join(pdfDir, filename), pdfBuffer)

    const pdfUrl = `/media/proposals/${userFolder}/${filename}`
    return NextResponse.json({ pdfUrl })
  } catch (error: any) {
    console.error('[PDF Generation Error]', error)
    return NextResponse.json({ pdfUrl: fallbackUrl })
  } finally {
    if (browser) {
      try { await browser.close() } catch {}
    }
  }
}
