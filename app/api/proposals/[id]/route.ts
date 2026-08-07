import { NextResponse } from 'next/server'
import { ProposalService } from '@/server/services/ProposalService'
import { getCurrentUser } from '@/server/utils/auth'
import { isRestricted } from '@/server/utils/roles'
import { safeErrorMessage } from '@/server/utils/errors'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const id = Number((await params).id)
    const proposal = await ProposalService.getById(id)
    if (!proposal) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (isRestricted(user) && proposal.createdById !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(proposal)
  } catch (error: any) {
    return NextResponse.json({ error: safeErrorMessage(error) }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const id = Number((await params).id)
    const proposal = await ProposalService.getById(id)
    if (!proposal) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (isRestricted(user) && proposal.createdById !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    // If only status is passed, do a simple status update
    if (Object.keys(body).length === 1 && body.status) {
      const updated = await ProposalService.updateStatus(id, body.status)
      return NextResponse.json(updated)
    }

    // Full edit update — update editable fields and rebuild snapshot with new tower/condition/paymentPlan
    const updated = await ProposalService.update(id, body)
    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json({ error: safeErrorMessage(error) }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const id = Number((await params).id)
    const proposal = await ProposalService.getById(id)
    if (!proposal) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (isRestricted(user) && proposal.createdById !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await ProposalService.delete(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: safeErrorMessage(error) }, { status: 500 })
  }
}
