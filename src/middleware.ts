import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // Catch NextAuth's built-in error page and redirect to our custom error page.
  // NextAuth v4 sometimes ignores `pages.error` in App Router, so we intercept here.
  // This does NOT cause redirect loops because we redirect to a DIFFERENT path.
  if (pathname === '/api/auth/error') {
    const error = request.nextUrl.searchParams.get('error') || 'Unknown'
    return NextResponse.redirect(
      new URL(`/auth/error?error=${encodeURIComponent(error)}`, request.url)
    )
  }

  return NextResponse.next()
}

// Only match the NextAuth error route — safe, no loops possible
export const config = {
  matcher: ['/api/auth/error'],
}