import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, nationality, notes, salesperson_id } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    let spId: number | null = null
    let spName: string | null = null
    let spSlug: string | null = null

    if (salesperson_id) {
      const salesperson = await prisma.salesperson.findUnique({
        where: { id: Number(salesperson_id) }
      })
      if (salesperson && salesperson.active) {
        spId = salesperson.id
        spName = salesperson.name
        spSlug = salesperson.slug
      }
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        nationality: nationality || null,
        source: spSlug ? `Referral (${spSlug})` : 'Public Portfolio',
        notes: notes || null,
        salesperson_id: spId,
        salesperson_name: spName,
        salesperson_slug: spSlug
      }
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
