// Middleware placeholder — Vercel handles www/non-www redirect automatically.
// Do NOT add www→non-www redirect here as it conflicts with Vercel's own redirect,
// causing ERR_TOO_MANY_REDIRECTS.

export function middleware() {
  // No-op: let Vercel handle domain redirects
}

export const config = {
  matcher: [],
}