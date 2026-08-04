import { checkPermission, AccessLevel } from '@/server/utils/permissions'
import { getCurrentUser } from '@/server/utils/auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!checkPermission(user, 'Salespersons', AccessLevel.EDIT)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { name, slug, phone, email, profileImage, active } = body

    if (slug) {
      // Check slug uniqueness excluding current
      const existing = await prisma.salesperson.findFirst({
        where: {
          slug: slug.toLowerCase().trim(),
          NOT: { id: Number(id) }
        }
      })
      if (existing) {
        return NextResponse.json({ error: 'Slug must be unique' }, { status: 400 })
      }
    }

    const salesperson = await prisma.salesperson.update({
      where: { id: Number(id) },
      data: {
        name,
        slug: slug ? slug.toLowerCase().trim() : undefined,
        phone,
        email,
        profileImage,
        active
      }
    })
    return NextResponse.json(salesperson)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!checkPermission(user, 'Salespersons', AccessLevel.EDIT)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { id } = await params
    await prisma.salesperson.delete({
      where: { id: Number(id) }
    })
    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
