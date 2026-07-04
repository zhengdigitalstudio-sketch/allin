import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

const READ_ROLES = ['SUPER_ADMIN', 'BENDAHARA', 'KETUA']
const WRITE_ROLES = ['SUPER_ADMIN', 'BENDAHARA']

// ─── GET ────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Anda harus login terlebih dahulu' },
        { status: 401 },
      )
    }

    const userRole = (session.user as any).role as string

    if (!READ_ROLES.includes(userRole)) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki akses untuk melihat data keuangan' },
        { status: 403 },
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const category = searchParams.get('category')
    const month = searchParams.get('month')   // YYYY-MM
    const year = searchParams.get('year')     // YYYY
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    // ── Build where clause ───────────────────────────────────────────────
    const where: any = {}

    if (type) where.type = type
    if (category) where.category = category

    if (month) {
      const [y, m] = month.split('-').map(Number)
      const startDate = new Date(y, m - 1, 1)
      const endDate = new Date(y, m, 1)
      where.date = { gte: startDate, lt: endDate }
    } else if (year) {
      const y = parseInt(year, 10)
      const startDate = new Date(y, 0, 1)
      const endDate = new Date(y + 1, 0, 1)
      where.date = { gte: startDate, lt: endDate }
    }

    // ── Pagination ───────────────────────────────────────────────────────
    const skip = (page - 1) * limit

    const [transactions, total, summaryResult] = await Promise.all([
      db.transaction.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
        include: {
          creator: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      db.transaction.count({ where }),
      // Summary uses the same filter (no pagination)
      db.transaction.aggregate({
        where,
        _sum: {
          amount: true,
        },
      }),
    ])

    // Per-type totals for summary
    const [masukResult, keluarResult] = await Promise.all([
      db.transaction.aggregate({
        where: { ...where, type: 'MASUK' },
        _sum: { amount: true },
      }),
      db.transaction.aggregate({
        where: { ...where, type: 'KELUAR' },
        _sum: { amount: true },
      }),
    ])

    const totalMasuk = masukResult._sum.amount ?? 0
    const totalKeluar = keluarResult._sum.amount ?? 0
    const saldo = totalMasuk - totalKeluar

    return NextResponse.json({
      transactions: transactions.map((t) => ({
        id: t.id,
        type: t.type,
        category: t.category,
        amount: t.amount,
        description: t.description,
        date: t.date.toISOString(),
        referenceNo: t.referenceNo,
        createdBy: t.createdBy,
        creatorName: t.creator?.name ?? null,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalMasuk,
        totalKeluar,
        saldo,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Gagal mengambil data keuangan' },
      { status: 500 },
    )
  }
}

// ─── POST ───────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Anda harus login terlebih dahulu' },
        { status: 401 },
      )
    }

    const userRole = (session.user as any).role as string
    const userId = (session.user as any).id as string

    if (!WRITE_ROLES.includes(userRole)) {
      return NextResponse.json(
        { error: 'Hanya SUPER_ADMIN dan BENDAHARA yang dapat menambahkan transaksi' },
        { status: 403 },
      )
    }

    const body = await request.json()
    const { type, category, amount, date, description, referenceNo } = body

    // ── Validation ───────────────────────────────────────────────────────
    if (!type) {
      return NextResponse.json(
        { error: 'Tipe transaksi (MASUK/KELUAR) wajib diisi' },
        { status: 400 },
      )
    }

    if (!['MASUK', 'KELUAR'].includes(type)) {
      return NextResponse.json(
        { error: 'Tipe transaksi harus MASUK atau KELUAR' },
        { status: 400 },
      )
    }

    if (!category) {
      return NextResponse.json(
        { error: 'Kategori transaksi wajib diisi' },
        { status: 400 },
      )
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Jumlah transaksi harus berupa angka positif' },
        { status: 400 },
      )
    }

    if (!date) {
      return NextResponse.json(
        { error: 'Tanggal transaksi wajib diisi' },
        { status: 400 },
      )
    }

    const parsedDate = new Date(date)
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: 'Format tanggal tidak valid' },
        { status: 400 },
      )
    }

    // ── Create transaction ───────────────────────────────────────────────
    const transaction = await db.transaction.create({
      data: {
        type,
        category,
        amount,
        date: parsedDate,
        description: description || null,
        referenceNo: referenceNo || null,
        createdBy: userId,
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json(
      {
        transaction: {
          id: transaction.id,
          type: transaction.type,
          category: transaction.category,
          amount: transaction.amount,
          description: transaction.description,
          date: transaction.date.toISOString(),
          referenceNo: transaction.referenceNo,
          createdBy: transaction.createdBy,
          creatorName: transaction.creator?.name ?? null,
          createdAt: transaction.createdAt.toISOString(),
          updatedAt: transaction.updatedAt.toISOString(),
        },
        message: 'Transaksi berhasil ditambahkan',
      },
      { status: 201 },
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Gagal menambahkan transaksi' },
      { status: 500 },
    )
  }
}

// ─── PUT ────────────────────────────────────────────────────────────────────
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Anda harus login terlebih dahulu' },
        { status: 401 },
      )
    }

    const userRole = (session.user as any).role as string

    if (!WRITE_ROLES.includes(userRole)) {
      return NextResponse.json(
        { error: 'Hanya SUPER_ADMIN dan BENDAHARA yang dapat mengubah transaksi' },
        { status: 403 },
      )
    }

    const body = await request.json()
    const { id, type, category, amount, date, description, referenceNo } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID transaksi wajib diisi' },
        { status: 400 },
      )
    }

    // ── Check existence ──────────────────────────────────────────────────
    const existing = await db.transaction.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Transaksi tidak ditemukan' },
        { status: 404 },
      )
    }

    // ── Build update data ────────────────────────────────────────────────
    const updateData: any = {}

    if (type !== undefined) {
      if (!['MASUK', 'KELUAR'].includes(type)) {
        return NextResponse.json(
          { error: 'Tipe transaksi harus MASUK atau KELUAR' },
          { status: 400 },
        )
      }
      updateData.type = type
    }

    if (category !== undefined) updateData.category = category

    if (amount !== undefined) {
      if (typeof amount !== 'number' || amount <= 0) {
        return NextResponse.json(
          { error: 'Jumlah transaksi harus berupa angka positif' },
          { status: 400 },
        )
      }
      updateData.amount = amount
    }

    if (date !== undefined) {
      const parsedDate = new Date(date)
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          { error: 'Format tanggal tidak valid' },
          { status: 400 },
        )
      }
      updateData.date = parsedDate
    }

    if (description !== undefined) updateData.description = description || null
    if (referenceNo !== undefined) updateData.referenceNo = referenceNo || null

    // ── Update transaction ───────────────────────────────────────────────
    const transaction = await db.transaction.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json({
      transaction: {
        id: transaction.id,
        type: transaction.type,
        category: transaction.category,
        amount: transaction.amount,
        description: transaction.description,
        date: transaction.date.toISOString(),
        referenceNo: transaction.referenceNo,
        createdBy: transaction.createdBy,
        creatorName: transaction.creator?.name ?? null,
        createdAt: transaction.createdAt.toISOString(),
        updatedAt: transaction.updatedAt.toISOString(),
      },
      message: 'Transaksi berhasil diperbarui',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Gagal memperbarui transaksi' },
      { status: 500 },
    )
  }
}

// ─── DELETE ─────────────────────────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Anda harus login terlebih dahulu' },
        { status: 401 },
      )
    }

    const userRole = (session.user as any).role as string

    if (userRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Hanya SUPER_ADMIN yang dapat menghapus transaksi' },
        { status: 403 },
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID transaksi wajib diisi' },
        { status: 400 },
      )
    }

    // ── Check existence ──────────────────────────────────────────────────
    const existing = await db.transaction.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Transaksi tidak ditemukan' },
        { status: 404 },
      )
    }

    await db.transaction.delete({ where: { id } })

    return NextResponse.json({ message: 'Transaksi berhasil dihapus' })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Gagal menghapus transaksi' },
      { status: 500 },
    )
  }
}