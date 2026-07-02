import { NextResponse } from 'next/server'
import { getRecipientLabels } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const labels = getRecipientLabels()
    if (labels.length === 0) {
      return NextResponse.json({ recipients: [] })
    }
    return NextResponse.json({ recipients: labels })
  } catch {
    return NextResponse.json({ recipients: [] })
  }
}