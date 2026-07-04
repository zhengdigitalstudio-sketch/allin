import { NextResponse } from 'next/server'

// Debug endpoint to inspect Google provider structure
// Visit: https://allin.web.id/api/check-auth
export async function GET() {
  const results: Record<string, any> = {}

  // 1. Env vars
  results.env = {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || '(NOT SET)',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID
      ? `${process.env.GOOGLE_CLIENT_ID.slice(0, 10)}...${process.env.GOOGLE_CLIENT_ID.slice(-10)} (${process.env.GOOGLE_CLIENT_ID.length} chars)`
      : '(NOT SET)',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? `SET (${process.env.GOOGLE_CLIENT_SECRET.length} chars)` : '(NOT SET)',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? `SET (${process.env.NEXTAUTH_SECRET.length} chars)` : '(NOT SET)',
  }

  // 2. Check authOptions
  try {
    const { authOptions } = await import('@/lib/auth')
    results.authOptionsLoaded = true
    results.providerCount = authOptions.providers?.length || 0

    const googleProvider: any = authOptions.providers?.find(
      (p: any) => p.id === 'google'
    )

    if (googleProvider) {
      // Dump ALL keys of the provider to see where clientId is stored
      results.providerKeys = Object.keys(googleProvider)
      results.providerId = googleProvider.id
      results.providerType = googleProvider.type
      results.providerName = googleProvider.name

      // Check all possible locations for clientId
      results.clientId_direct = googleProvider.clientId || '(empty)'
      results.clientSecret_direct = googleProvider.clientSecret ? '(SET)' : '(EMPTY)'

      // Check nested locations
      results.client_id = googleProvider.client?.id || '(empty)'
      results.client_clientId = googleProvider.client?.clientId || '(empty)'

      // Check authorization config
      results.authUrl = googleProvider.authorization?.url || '(empty)'
      results.authParams = googleProvider.authorization?.params || {}

      // Check token config
      results.tokenUrl = googleProvider.token?.url || '(empty)'

      // Check wellknown
      results.wellKnown = googleProvider.wellKnown || '(empty)'

      // Try to find clientId anywhere in the object (max depth 2)
      let found = false
      for (const key of Object.keys(googleProvider)) {
        const val = (googleProvider as any)[key]
        if (typeof val === 'string' && val.includes('googleusercontent')) {
          results[`clientId_found_in_${key}`] = `YES — ${val.slice(0, 15)}...${val.slice(-15)}`
          found = true
        }
        if (typeof val === 'object' && val !== null) {
          for (const subKey of Object.keys(val)) {
            const subVal = (val as any)[subKey]
            if (typeof subVal === 'string' && subVal.includes('googleusercontent')) {
              results[`clientId_found_in_${key}.${subKey}`] = `YES — ${subVal.slice(0, 15)}...${subVal.slice(-15)}`
              found = true
            }
          }
        }
      }
      if (!found) {
        results.clientId_found_anywhere = 'NO — clientId not found in provider object!'
      }
    } else {
      results.googleProvider = 'NOT FOUND'
      // Show what providers exist
      results.allProviderIds = authOptions.providers?.map((p: any) => p.id)
    }
  } catch (error: any) {
    results.authOptionsError = error?.message
    results.errorStack = error?.stack?.slice(0, 300)
  }

  return NextResponse.json(results)
}