import { NextResponse } from 'next/server'
import { getRecipientOptions } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const options = getRecipientOptions()
    return NextResponse.json({ recipients: options })
  } catch {
    return NextResponse.json({ recipients: [] })
  }
}