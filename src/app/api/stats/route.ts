import { NextRequest, NextResponse } from 'next/server'
import { getSession, PENGURUS_ROLES } from '@/lib/auth'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)

    // Public stats (no auth required) — used by homepage
    if (!session) {
      const [totalMembers, totalArticles, totalPengurus, totalAgenda] = await Promise.all([
        db.user.count({ where: { role: 'MEMBER', isActive: true } }),
        db.article.count({ where: { status: 'PUBLISHED' } }),
        db.user.count({ where: { role: { in: PENGURUS_ROLES }, isActive: true } }),
        db.agenda.count({ where: { status: 'AKTIF', isInternal: false } }),
      ])

      return NextResponse.json({
        totalMembers,
        totalArticles,
        totalPengurus,
        totalAgenda,
      })
    }

    // Dashboard stats (auth required) — full data for admin/pengurus
    const userRole = session.role
    if (!PENGURUS_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const now = new Date()

    const [
      totalMembers,
      totalPengurus,
      totalArticles,
      publishedArticles,
      pendingRegistrations,
      totalAgenda,
      upcomingAgenda,
      totalContacts,
      monthlyRegistrationsRaw,
      articleCategoriesRaw,
    ] = await Promise.all([
      db.user.count({
        where: { role: 'MEMBER', isActive: true },
      }),
      db.user.count({
        where: { role: { in: PENGURUS_ROLES }, isActive: true },
      }),
      db.article.count(),
      db.article.count({
        where: { status: 'PUBLISHED' },
      }),
      db.member.count({
        where: { status: 'MENUNGGU' },
      }),
      db.agenda.count(),
      db.agenda.count({
        where: { date: { gte: now } },
      }),
      db.contact.count({
        where: { isRead: false },
      }),
      // Monthly registrations for last 6 months
      db.$queryRaw<Array<{ month: string; count: bigint }>>`
        SELECT
          TO_CHAR("createdAt", 'YYYY-MM') AS month,
          COUNT(*)::bigint AS count
        FROM "Member"
        WHERE "createdAt" >= NOW() - INTERVAL '6 months'
        GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
        ORDER BY month ASC
      `,
      // Article categories
      db.$queryRaw<Array<{ category: string; count: bigint }>>`
        SELECT "category", COUNT(*)::bigint AS count
        FROM "Article"
        GROUP BY "category"
        ORDER BY count DESC
      `,
    ])

    // Build monthly registrations array — fill in missing months with 0
    const monthlyRegistrations = buildMonthlyRegistrations(monthlyRegistrationsRaw)

    // Map article categories
    const articleCategories = articleCategoriesRaw.map((row) => ({
      category: row.category,
      count: Number(row.count),
    }))

    return NextResponse.json({
      totalMembers,
      totalPengurus,
      totalArticles,
      publishedArticles,
      pendingRegistrations,
      totalAgenda,
      upcomingAgenda,
      totalContacts,
      monthlyRegistrations,
      articleCategories,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mengambil statistik'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * Given the raw query result, produce an array of { month, count } for the
 * last 6 consecutive months, filling gaps with count: 0.
 */
function buildMonthlyRegistrations(
  rows: Array<{ month: string; count: bigint }>,
): Array<{ month: string; count: number }> {
  const result: Array<{ month: string; count: number }> = []

  // Build a map from raw data
  const map = new Map<string, number>()
  for (const row of rows) {
    map.set(row.month, Number(row.count))
  }

  // Generate last 6 months
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    result.push({ month: key, count: map.get(key) ?? 0 })
  }

  return result
}