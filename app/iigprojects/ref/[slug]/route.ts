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

  // Redirect visitor to /iigprojects
  const url = new URL('/iigprojects', request.url)
  return NextResponse.redirect(url)
}
