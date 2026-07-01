import { NextResponse } from 'next/server'

// Test endpoint — checks Google OAuth config without actually signing in
// Visit: https://allin.web.id/api/auth/test
// TODO: remove after fixing auth
export async function GET() {
  const results: Record<string, string> = {}

  // 1. Check env vars
  results.NEXTAUTH_URL = process.env.NEXTAUTH_URL || '(NOT SET)'
  results.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
    ? `SET (${process.env.GOOGLE_CLIENT_ID.length} chars)`
    : '(NOT SET)'
  results.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
    ? `SET (${process.env.GOOGLE_CLIENT_SECRET.length} chars)`
    : '(NOT SET)'
  results.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET
    ? `SET (${process.env.NEXTAUTH_SECRET.length} chars)`
    : '(NOT SET)'

  // 2. Check client ID format
  const clientId = process.env.GOOGLE_CLIENT_ID || ''
  const validClientId = clientId.endsWith('.apps.googleusercontent.com') && clientId.includes('-')
  results.clientIdFormatValid = validClientId ? 'YES' : `NO — ends with: "${clientId.slice(-30)}"`

  // 3. Try to compute the callback URL
  const baseUrl = process.env.NEXTAUTH_URL || 'https://allin.web.id'
  results.computedCallbackUrl = `${baseUrl}/api/auth/callback/google`

  // 4. Check if authOptions can be imported
  try {
    const { authOptions } = await import('@/lib/auth')
    results.authOptionsLoaded = 'YES'
    results.providerCount = String(authOptions.providers?.length || 0)

    // Check Google provider config
    const googleProvider = authOptions.providers?.find(
      (p: any) => p.id === 'google'
    )
    if (googleProvider) {
      results.googleProviderClientId = googleProvider.clientId
        ? `SET (${googleProvider.clientId.length} chars)`
        : '(EMPTY!)'
      results.googleProviderClientSecret = googleProvider.clientSecret
        ? `SET (${googleProvider.clientSecret.length} chars)`
        : '(EMPTY!)'
      results.googleProviderAllowLinking = String(
        googleProvider.allowDangerousEmailAccountLinking
      )
    } else {
      results.googleProvider = 'NOT FOUND in providers list!'
    }

    results.secretSet = authOptions.secret ? 'YES' : 'NO!'
    results.sessionStrategy = authOptions.session?.strategy || 'NOT SET'
  } catch (error: any) {
    results.authOptionsLoaded = `ERROR: ${error?.message}`
    results.errorStack = error?.stack?.slice(0, 300) || 'no stack'
  }

  return NextResponse.json(results, { status: 200 })
}