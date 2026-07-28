import { NextResponse } from 'next/server'
import { ProposalService } from '@/server/services/ProposalService'

export const runtime = 'nodejs'

/**
 * Instead of Puppeteer (which needs Chromium — unavailable on shared hosting),
 * we return the template URL so the client can open it in a new tab and print it
 * as a PDF using the browser's native print dialog.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = Number((await params).id)
    const proposal = await ProposalService.getById(id)
    if (!proposal) return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })

    const host = request.headers.get('host') || 'localhost:3000'
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const baseUrl = `${protocol}://${host}`

    // Return the template URL with ?print=1 so the page auto-triggers print dialog
    const templateUrl = `${baseUrl}/proposals/${id}/template?print=1`

    return NextResponse.json({ pdfUrl: templateUrl })
  } catch (error: any) {
    console.error('[PDF Generation Error]', error)
    return NextResponse.json({ error: `Failed: ${error.message}` }, { status: 500 })
  }
}
