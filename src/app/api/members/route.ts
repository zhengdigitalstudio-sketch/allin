import { getSession, PENGURUS_ROLES, APPROVER_ROLES, ARTICLE_CREATE_ROLES, isValidEmail } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
// Allow large base64-encoded photos/logos/documents (~5MB each)
export const bodySizeLimit = '15mb'


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    const session = await getSession(request)

    if (!session) {
      return NextResponse.json({ members: [], pagination: { page, limit, total: 0, totalPages: 0 } })
    }

    const userRole = session?.role || ''
    const userId = session?.id || ''

    const where: any = {}

    if (PENGURUS_ROLES.includes(userRole)) {
      // All pengurus see all members
      if (status) where.status = status
      if (search) {
        where.OR = [
          { fullName: { contains: search, mode: 'insensitive' } },
          { companyName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ]
      }
    } else {
      // Regular member sees own data + approved members
      const member = await db.member.findUnique({ where: { userId } })
      if (member) {
        where.OR = [
          { id: member.id },
          { status: 'DISETUJUI' }
        ]
      } else {
        return NextResponse.json({ members: [], pagination: { page, limit, total: 0, totalPages: 0 } })
      }
    }

    const skip = (page - 1) * limit

    const [members, total] = await Promise.all([
      db.member.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.member.count({ where }),
    ])

    return NextResponse.json({
      members: members.map((m) => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: unknown) {
    console.error('[Members API] Error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Gagal mengambil data anggota' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fullName, email, phone, companyName, institution, position, address, city, province, memberType, logo, photo, document, reason } = body

    if (!fullName || !email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Nama wajib diisi dan format email tidak valid' }, { status: 400 })
    }

    // Check if email already registered
    const existingMember = await db.member.findUnique({ where: { email } })
    if (existingMember) {
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 409 })
    }

    const member = await db.member.create({
      data: {
        fullName,
        email,
        phone: phone || null,
        companyName: companyName || null,
        institution: institution || null,
        position: position || null,
        address: address || null,
        city: city || null,
        province: province || null,
        memberType: memberType || 'Perorangan',
        logo: logo || null,
        photo: photo || null,
        document: document || null,
        reason: reason || null,
        status: 'MENUNGGU',
      },
    })

    return NextResponse.json({
      member: {
        ...member,
        createdAt: member.createdAt.toISOString(),
        updatedAt: member.updatedAt.toISOString(),
      },
    }, { status: 201 })
  } catch (error: unknown) {
    console.error('[Members POST] Error:', error)
    if (error && typeof error === 'object' && 'code' in error && (error as any).code === 'P2002') {
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Gagal mendaftar anggota' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateFields } = body

    if (!id) {
      return NextResponse.json({ error: 'ID anggota wajib diisi' }, { status: 400 })
    }

    const existing = await db.member.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Anggota tidak ditemukan' }, { status: 404 })
    }

    const userRole = session?.role || ''
    const userId = session?.id || ''

    // SUPER_ADMIN can update any member including status
    // Other users can only update their own profile (non-status fields)
    if (!PENGURUS_ROLES.includes(userRole)) {
      if (existing.userId !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      // Remove status field for non-admin updates
      delete updateFields.status
    }

    const updateData: any = {}
    const allowedFields = ['fullName', 'email', 'phone', 'companyName', 'institution', 'position', 'address', 'city', 'province', 'memberType', 'logo', 'photo', 'document', 'reason', 'status']
    for (const field of allowedFields) {
      if (updateFields[field] !== undefined) {
        updateData[field] = updateFields[field]
      }
    }

    const member = await db.member.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      member: {
        ...member,
        createdAt: member.createdAt.toISOString(),
        updatedAt: member.updatedAt.toISOString(),
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal memperbarui data anggota' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session?.role || ''
    if (!PENGURUS_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID anggota wajib diisi' }, { status: 400 })
    }

    const existing = await db.member.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Anggota tidak ditemukan' }, { status: 404 })
    }

    await db.member.delete({ where: { id } })

    return NextResponse.json({ message: 'Anggota berhasil dihapus' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal menghapus anggota' }, { status: 500 })
  }
}