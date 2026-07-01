import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

const PENGURUS_ROLES = ['SUPER_ADMIN', 'KETUA', 'WAKIL_KETUA', 'SEKRETARIS', 'WAKIL_SEKRETARIS', 'BENDAHARA']

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role as string
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