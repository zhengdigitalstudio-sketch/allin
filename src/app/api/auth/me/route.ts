import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    // Fetch fresh user data from DB
    const user = await db.user.findUnique({
      where: { id: session.id },
      select: {
        id: true, name: true, email: true, role: true,
        avatar: true, phone: true, position: true, company: true,
        isActive: true,
      },
    })

    if (!user || !user.isActive) {
      // User no longer exists or is deactivated
      return NextResponse.json({ user: null }, { status: 200 })
    }

    return NextResponse.json({ user })
  } catch {
    return NextResponse.json({ user: null }, { status: 200 })
  }
}