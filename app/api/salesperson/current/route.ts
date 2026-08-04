import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const slug = cookieStore.get('salesperson')?.value

    if (!slug) {
      return NextResponse.json(null)
    }

    const salesperson = await prisma.salesperson.findUnique({
      where: { slug: slug.toLowerCase().trim() }
    })

    if (!salesperson || !salesperson.active) {
      return NextResponse.json(null)
    }

    return NextResponse.json({
      id: salesperson.id,
      name: salesperson.name,
      slug: salesperson.slug,
      phone: salesperson.phone,
      email: salesperson.email,
      profileImage: salesperson.profileImage
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
