import { checkPermission, AccessLevel } from '@/server/utils/permissions'
import { getCurrentUser } from '@/server/utils/auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!checkPermission(user, 'Salespersons', AccessLevel.VIEW)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const salespersons = await prisma.salesperson.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(salespersons)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!checkPermission(user, 'Salespersons', AccessLevel.EDIT)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { name, slug, phone, email, profileImage, active } = body
    if (!name || !slug || !phone || !email) {
      return NextResponse.json({ error: 'name, slug, phone, and email are required' }, { status: 400 })
    }

    // Check slug uniqueness
    const existing = await prisma.salesperson.findUnique({
      where: { slug: slug.toLowerCase().trim() }
    })
    if (existing) {
      return NextResponse.json({ error: 'Slug must be unique' }, { status: 400 })
    }

    const salesperson = await prisma.salesperson.create({
      data: {
        name,
        slug: slug.toLowerCase().trim(),
        phone,
        email,
        profileImage,
        active: active !== undefined ? active : true
      }
    })
    return NextResponse.json(salesperson, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
