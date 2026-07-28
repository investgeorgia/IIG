import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key-replace-in-production')

// Define protected paths
const protectedPaths = ['/dashboard', '/cms', '/proposals']
const authPaths = ['/login']

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value
  const { pathname } = request.nextUrl

  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))
  const isAuthPath = authPaths.some(path => pathname.startsWith(path))

  if (isAuthPath && token) {
    try {
      await jwtVerify(token, JWT_SECRET)
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } catch (e) {}
  }

  if (isProtectedPath) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      // Basic RBAC can be expanded here based on payload.role
      return NextResponse.next()
    } catch (error) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|uploads|media).*)',
  ],
}
