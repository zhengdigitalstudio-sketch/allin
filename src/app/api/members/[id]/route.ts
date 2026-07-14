import { getSession, PENGURUS_ROLES, APPROVER_ROLES, hashPassword } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
// Allow large base64-encoded photos/logos/documents (~5MB each)
export const bodySizeLimit = '15mb'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const member = await db.member.findUnique({ where: { id } })

    if (!member) {
      return NextResponse.json({ error: 'Anggota tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({
      member: {
        ...member,
        createdAt: member.createdAt.toISOString(),
        updatedAt: member.updatedAt.toISOString(),
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal mengambil data anggota' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session?.role || ''

    const { id } = await params
    const body = await request.json()
    const { status, password: memberPassword, ...otherFields } = body

    const existing = await db.member.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Anggota tidak ditemukan' }, { status: 404 })
    }

    const updateData: any = {}

    // ── Member approval: create User account ──
    if (status === 'DISETUJUI' && existing.status !== 'DISETUJUI') {
      // Only Ketua, Wakil Ketua, or Super Admin can approve
      if (!APPROVER_ROLES.includes(userRole)) {
        return NextResponse.json({ error: 'Hanya Ketua atau Wakil Ketua yang dapat menyetujui pendaftaran' }, { status: 403 })
      }

      // Default password for new approved members
      const DEFAULT_MEMBER_PASSWORD = 'member123'

      // Check if user account already exists for this member
      if (existing.userId) {
        // Just activate the existing user
        await db.user.update({ where: { id: existing.userId }, data: { isActive: true } })
        updateData.status = 'DISETUJUI'
      } else {
        // Create a new User account so they can login
        // Default password is 'member123' (admin can override via memberPassword field)
        const pw = memberPassword || DEFAULT_MEMBER_PASSWORD
        const hashedPw = await hashPassword(pw)

        const newUser = await db.user.create({
          data: {
            name: existing.fullName,
            email: existing.email,
            password: hashedPw,
            role: 'MEMBER',
            phone: existing.phone,
            position: existing.position,
            company: existing.companyName,
            isActive: true,
          },
        })

        updateData.status = 'DISETUJUI'
        updateData.userId = newUser.id

        // Return the password so admin can share it with the member
        const updated = await db.member.update({ where: { id }, data: updateData })
        return NextResponse.json({
          member: {
            ...updated,
            createdAt: updated.createdAt.toISOString(),
            updatedAt: updated.updatedAt.toISOString(),
          },
          generatedPassword: pw,
          message: memberPassword
            ? 'Anggota disetujui dan akun dibuat dengan password custom'
            : `Anggota disetujui. Akun dibuat dengan password default "${DEFAULT_MEMBER_PASSWORD}". Berikan info ini kepada anggota dan sarankan untuk segera mengganti password setelah login pertama.`,
        })
      }
    }

    if (status === 'DITOLAK') {
      if (!APPROVER_ROLES.includes(userRole)) {
        return NextResponse.json({ error: 'Hanya Ketua atau Wakil Ketua yang dapat menolak pendaftaran' }, { status: 403 })
      }
    }

    // Other status updates need pengurus role
    if (status && !APPROVER_ROLES.includes(userRole) && !PENGURUS_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (status) updateData.status = status

    // Only SUPER_ADMIN or the member's own linked user can update other fields
    if (Object.keys(otherFields).length > 0) {
      const isOwner = existing.userId === session.id
      const isAdmin = PENGURUS_ROLES.includes(userRole)
      if (!isAdmin && !isOwner) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      // Whitelist allowed fields
      const allowedFields = ['fullName', 'email', 'phone', 'companyName', 'memberType', 'position', 'address', 'city', 'province', 'reason']
      for (const key of Object.keys(otherFields)) {
        if (allowedFields.includes(key)) {
          (updateData as any)[key] = (otherFields as any)[key]
        }
      }

      // Admin only: allow editing registration date (createdAt)
      if (otherFields.createdAt && PENGURUS_ROLES.includes(userRole)) {
        const newDate = new Date(otherFields.createdAt)
        if (!isNaN(newDate.getTime())) {
          (updateData as any).createdAt = newDate
        }
      }
    }

    const updated = await db.member.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      member: {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal mengupdate anggota' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session?.role || ''
    if (!PENGURUS_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const existing = await db.member.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Anggota tidak ditemukan' }, { status: 404 })
    }

    // If member has a linked user account, deactivate it
    if (existing.userId) {
      await db.user.update({ where: { id: existing.userId }, data: { isActive: false } })
    }

    await db.member.delete({ where: { id } })

    return NextResponse.json({ message: 'Anggota berhasil dihapus' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal menghapus anggota' }, { status: 500 })
  }
}