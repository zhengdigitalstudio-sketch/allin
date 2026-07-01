import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Catch Google OAuth callback errors BEFORE NextAuth processes them.
  //    When Google returns an error (e.g. redirect_uri_mismatch), it redirects to:
  //    /api/auth/callback/google?error=redirect_uri_mismatch&error_description=...
  //    We intercept this here to get the ACTUAL Google error message.
  if (pathname === '/api/auth/callback/google') {
    const googleError = request.nextUrl.searchParams.get('error')
    if (googleError) {
      const desc = request.nextUrl.searchParams.get('error_description') || googleError
      return NextResponse.redirect(
        new URL(
          `/auth/error?error=OAuthCallback&google_error=${encodeURIComponent(googleError)}&detail=${encodeURIComponent(desc)}`,
          request.url
        )
      )
    }
  }

  // 2. Catch NextAuth's built-in error page and redirect to our custom error page.
  //    NextAuth v4 sometimes ignores `pages.error` in App Router.
  if (pathname === '/api/auth/error') {
    const error = request.nextUrl.searchParams.get('error') || 'Unknown'
    return NextResponse.redirect(
      new URL(`/auth/error?error=${encodeURIComponent(error)}`, request.url)
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/auth/callback/google', '/api/auth/error'],
}