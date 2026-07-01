import { NextResponse } from 'next/server'
import { createLogoutCookie } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  return NextResponse.json(
    { message: 'Berhasil keluar' },
    {
      status: 200,
      headers: { 'Set-Cookie': createLogoutCookie() },
    }
  )
}