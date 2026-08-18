import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AuthService } from '@/server/services/AuthService'
import { SessionRepository } from '@/server/repositories/SessionRepository'

// List of public API endpoint prefixes that do not require authentication
const PUBLIC_API_PREFIXES = [
  '/api/auth/',
  '/api/public/',
  '/api/tracking/',
  '/api/salesperson/',
  '/api/ips-registration',
  '/api/otp/'
]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // We only run this middleware check on API routes
  if (pathname.startsWith('/api/')) {
    // Check if the route is a public route
    const isPublic = PUBLIC_API_PREFIXES.some(prefix => pathname.startsWith(prefix))

    if (!isPublic) {
      const token = request.cookies.get('auth_token')?.value

      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const payload = await AuthService.verifyToken(token)
      if (!payload || !payload.sub) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // Check Session database representation as well
      const session = await SessionRepository.findByToken(token)
      if (!session || session.expiresAt < new Date()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }
  }

  // Inject security headers on every response
  const response = NextResponse.next()
  
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')

  return response
}

// Config matching all paths except static files or pages
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, icons, logo etc. (public asset directories)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

export default proxy
