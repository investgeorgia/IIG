import { NextResponse } from 'next/server'
import { ProposalService } from '@/server/services/ProposalService'
import { getCurrentUser } from '@/server/utils/auth'
import { isRestricted } from '@/server/utils/roles'
import { safeErrorMessage } from '@/server/utils/errors'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const url = new URL(request.url)
    const agentId = url.searchParams.get('agentId')

    const where: any = isRestricted(user) ? { createdById: user.id } : {}
    if (agentId && !isRestricted(user)) {
      where.createdById = Number(agentId)
    }

    const proposals = await ProposalService.getAll(where)
    return NextResponse.json(proposals)
  } catch (error: any) {
    return NextResponse.json({ error: safeErrorMessage(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const createdById = user.id
    const body = await request.json()
    const proposal = await ProposalService.create({ ...body, createdById })
    return NextResponse.json(proposal, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: safeErrorMessage(error) }, { status: 500 })
  }
}
