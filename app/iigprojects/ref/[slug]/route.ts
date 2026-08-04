import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const decodedSlug = decodeURIComponent(slug).toLowerCase().trim()

    // Find salesperson in db
    const salesperson = await prisma.salesperson.findUnique({
      where: { slug: decodedSlug }
    })

    const cookieStore = await cookies()

    if (salesperson && salesperson.active) {
      // Save to secure cookie with 30-day expiry
      cookieStore.set('salesperson', decodedSlug, {
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
        secure: true,
        httpOnly: false,
        sameSite: 'lax'
      })
    } else {
      // If invalid/inactive, remove cookie to default to company contact
      cookieStore.delete('salesperson')
    }
  } catch (err) {
    console.error('[Referral Route Error]', err)
  }

  // Build the redirect URL from the Host header so it works on shared hosting
  // where request.url base resolves to the internal 0.0.0.0:3000 address
  const host = request.headers.get('host') ?? 'investgeorgia.ae'
  const proto = request.headers.get('x-forwarded-proto') ?? 'https'
  return NextResponse.redirect(`${proto}://${host}/iigprojects`)
}
