import { NextResponse } from 'next/server'
import { ProposalService } from '@/server/services/ProposalService'
import { buildProposalHtml } from '@/server/services/ProposalHtmlBuilder'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = Number((await params).id)
    const proposal = await ProposalService.getById(id)
    
    if (!proposal) {
      return new NextResponse('Proposal not found', { status: 404 })
    }

    const host = request.headers.get('host') || 'localhost:3000'
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const baseUrl = `${protocol}://${host}`

    const html = buildProposalHtml(proposal, baseUrl)

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    })
  } catch (error: any) {
    return new NextResponse(`Error: ${error.message}`, { status: 500 })
  }
}
