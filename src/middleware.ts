// Middleware disabled — Next.js 16 deprecates middleware.ts in favor of proxy.ts
// Vercel handles www→non-www redirect via domain settings.
// OAuth error page is handled via pages.error in auth.ts → /auth/error

export function middleware() {
  // No-op
}

export const config = {
  matcher: [],
}