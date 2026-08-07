import { checkPermission, AccessLevel } from '@/server/utils/permissions'
import { getCurrentUser } from '@/server/utils/auth'
import { isRestricted } from '@/server/utils/roles'
import { NextResponse } from 'next/server'
import { CustomerService } from '@/server/services/CustomerService'

export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!checkPermission(user, 'Customers', AccessLevel.VIEW)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''

    const where = isRestricted(user) ? { assignedToId: user.id } : undefined
    const customers = await CustomerService.search(q, where)
    return NextResponse.json(customers)
  } catch (error: any) {
    console.error('[Search] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
