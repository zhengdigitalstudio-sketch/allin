import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const hostname = url.hostname

  // Redirect www to non-www
  if (hostname.startsWith('www.')) {
    url.hostname = hostname.replace('www.', '')
    return NextResponse.redirect(url, 301)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except API routes, static files, and _next
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|.*\\.png|.*\\.jpg|.*\\.ico).*)',
  ],
}