import { NextResponse } from 'next/server'
import { ProposalService } from '@/server/services/ProposalService'
import { buildProposalHtml } from '@/server/services/ProposalHtmlBuilder'
import puppeteer from 'puppeteer'
import path from 'path'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'

export const runtime = 'nodejs'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let browser = null
  try {
    const id = Number((await params).id)
    const proposal = await ProposalService.getById(id)
    if (!proposal) return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })

    const host = request.headers.get('host') || 'localhost:3000'
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const baseUrl = `${protocol}://${host}`

    // Build fully-rendered HTML (inlines logo, substitutes all placeholders, appends gallery)
    const html = buildProposalHtml(proposal, baseUrl)

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    })
    const page = await browser.newPage()

    await page.setContent(html, { waitUntil: 'load', timeout: 30000 })

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' }
    })

    const envPath = process.env.MEDIA_STORAGE_PATH
    const baseDir = envPath || path.join(process.cwd(), 'public', 'media')
    const userFolder = proposal.createdById ? `user-${proposal.createdById}` : 'user-general'
    const pdfDir = path.join(baseDir, 'proposals', userFolder)

    if (!existsSync(pdfDir)) await mkdir(pdfDir, { recursive: true })
    const filename = `proposal-${id}-${Date.now()}.pdf`
    await writeFile(path.join(pdfDir, filename), pdfBuffer)

    const pdfUrl = `/media/proposals/${userFolder}/${filename}`
      
    return NextResponse.json({ pdfUrl })
  } catch (error: any) {
    console.error('[PDF Generation Error]', error)
    return NextResponse.json({ error: `Failed to generate PDF: ${error.message}` }, { status: 500 })
  } finally {
    if (browser) await browser.close()
  }
}
