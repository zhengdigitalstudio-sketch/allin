import { getSession, PENGURUS_ROLES, APPROVER_ROLES, ARTICLE_CREATE_ROLES } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'


export async function GET() {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session?.role || ''
    if (!PENGURUS_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [
      totalMembers,
      totalArticles,
      totalPengurus,
      totalContacts,
      totalAgenda,
      totalGallery,
      totalPendingMembers,
    ] = await Promise.all([
      db.member.count({ where: { status: 'DISETUJUI' } }),
      db.article.count({ where: { status: 'PUBLISHED' } }),
      db.user.count({ where: { role: { in: PENGURUS_ROLES } } }),
      db.contact.count(),
      db.agenda.count(),
      db.gallery.count(),
      db.member.count({ where: { status: 'MENUNGGU' } }),
    ])

    return NextResponse.json({
      totalMembers,
      totalArticles,
      totalPengurus,
      totalContacts,
      totalAgenda,
      totalGallery,
      totalPendingMembers,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal mengambil statistik' }, { status: 500 })
  }
}