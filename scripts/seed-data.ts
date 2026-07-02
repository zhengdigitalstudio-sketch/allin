import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Get existing users
  const users = await prisma.user.findMany()
  if (users.length === 0) {
    console.log('No users found. Run seed-neon.ts first.')
    return
  }

  const ketua = users.find(u => u.role === 'KETUA') || users[0]
  const wakil = users.find(u => u.role === 'WAKIL_KETUA') || users[1]
  const sekretaris = users.find(u => u.role === 'SEKRETARIS') || users[2]
  const wakilSekretaris = users.find(u => u.role === 'WAKIL_SEKRETARIS') || users[3]
  const bendahara = users.find(u => u.role === 'BENDAHARA') || users[4]
  const admin = users.find(u => u.role === 'SUPER_ADMIN') || users[5]

  // Create sample articles
  const articles = [
    {
      title: 'ALLIN Gelar Rapat Koordinasi Nasional Tahun 2024',
      slug: 'allin-gelar-rapat-koordinasi-nasional-tahun-2024',
      content: '<p>Asosiasi Lingkungan Industri Ketenagalistrikan Nasional (ALLIN) berhasil menyelenggarakan Rapat Koordinasi Nasional Tahun 2024 yang dihadiri oleh seluruh pengurus dan perwakilan anggota dari berbagai daerah di Indonesia.</p><p>Rapat ini membahas berbagai agenda penting termasuk program kerja tahunan, laporan keuangan, serta strategi pengembangan organisasi ke depan.</p>',
      excerpt: 'ALLIN berhasil menyelenggarakan Rapat Koordinasi Nasional Tahun 2024.',
      category: 'Berita',
      status: 'PUBLISHED',
      isMemberOnly: false,
      authorId: ketua.id,
      publishedAt: new Date('2024-01-15'),
      viewCount: 125,
    },
    {
      title: 'Peraturan Pemerintah Nomor 25 Tahun 2024 tentang Tarif Tenaga Listrik',
      slug: 'pp-nomor-25-tahun-2024-tarif-tenaga-listrik',
      content: '<p>Pemerintah telah menerbitkan Peraturan Pemerintah Nomor 25 Tahun 2024 yang mengatur tentang perubahan tarif tenaga listrik untuk berbagai golongan pelanggan.</p>',
      excerpt: 'Analisis mengenai PP No. 25/2024 tentang perubahan tarif tenaga listrik.',
      category: 'Regulasi',
      status: 'PUBLISHED',
      isMemberOnly: false,
      authorId: wakil.id,
      publishedAt: new Date('2024-02-20'),
      viewCount: 89,
    },
    {
      title: 'Tren Smart Grid di Sektor Ketenagalistrikan Indonesia',
      slug: 'tren-smart-grid-sektor-ketenagalistrikan',
      content: '<p>Transformasi digital telah menjadi tren utama di sektor ketenagalistrikan Indonesia. Smart Grid semakin diadopsi oleh berbagai perusahaan listrik.</p>',
      excerpt: 'Pelajari tren Smart Grid yang sedang mengubah sektor ketenagalistrikan Indonesia.',
      category: 'Teknologi',
      status: 'PUBLISHED',
      isMemberOnly: false,
      authorId: sekretaris.id,
      publishedAt: new Date('2024-03-10'),
      viewCount: 67,
    },
    {
      title: 'Workshop Peningkatan Kompetensi Teknis Anggota ALLIN',
      slug: 'workshop-peningkatan-kompetensi-teknis',
      content: '<p>ALLIN telah menyelenggarakan Workshop Peningkatan Kompetensi Teknis yang diikuti oleh lebih dari 100 peserta.</p>',
      excerpt: 'Workshop diikuti lebih dari 100 peserta untuk meningkatkan kompetensi teknis.',
      category: 'Kegiatan',
      status: 'PUBLISHED',
      isMemberOnly: false,
      authorId: wakilSekretaris.id,
      publishedAt: new Date('2024-04-05'),
      viewCount: 45,
    },
    {
      title: 'Masa Depan Energi Terbarukan di Indonesia',
      slug: 'masa-depan-energi-terbarukan-indonesia',
      content: '<p>Indonesia memiliki potensi energi terbarukan yang sangat besar, namun pemanfaatannya masih menghadapi berbagai tantangan.</p>',
      excerpt: 'Analisis potensi dan tantangan pengembangan energi terbarukan di Indonesia.',
      category: 'Opini',
      status: 'PUBLISHED',
      isMemberOnly: true,
      authorId: bendahara.id,
      publishedAt: new Date('2024-05-12'),
      viewCount: 23,
    },
    {
      title: 'Laporan Keuangan Semester I 2024 (Draft)',
      slug: 'laporan-keuangan-semester-i-2024',
      content: '<p>Draft laporan keuangan semester I tahun 2024.</p>',
      excerpt: 'Draft laporan keuangan.',
      category: 'Berita',
      status: 'DRAFT',
      isMemberOnly: false,
      authorId: admin.id,
      viewCount: 0,
    },
  ]

  for (const a of articles) {
    await prisma.article.upsert({ where: { slug: a.slug }, update: {}, create: a })
  }
  console.log(`✅ ${articles.length} articles seeded`)

  // Create agenda
  const now = new Date()
  const agendas = [
    { title: 'Musyawarah Nasional ALLIN 2025', description: 'Musyawarah Nasional tahunan ALLIN.', date: new Date(now.getFullYear(), now.getMonth() + 2, 15), location: 'Hotel Indonesia Kempinski, Jakarta', isInternal: false, status: 'MENDATANG' },
    { title: 'Seminar Nasional Transisi Energi', description: 'Seminar nasional tentang transisi energi di Indonesia.', date: new Date(now.getFullYear(), now.getMonth() + 1, 20), location: 'Auditorium PLN, Jakarta', isInternal: false, status: 'MENDATANG' },
    { title: 'Rapat Pengurus Harian Bulanan', description: 'Rapat rutin bulanan pengurus harian.', date: new Date(now.getFullYear(), now.getMonth(), 25), location: 'Sekretariat ALLIN, Jakarta', isInternal: true, status: 'AKTIF' },
    { title: 'Workshop Keselamatan Kerja Kelistrikan', description: 'Workshop tentang standar keselamatan kerja di sektor kelistrikan.', date: new Date(now.getFullYear(), now.getMonth() + 3, 10), location: 'PLN Training Center, Jakarta', isInternal: false, status: 'MENDATANG' },
    { title: 'Rapat Koordinasi dengan Kementerian ESDM', description: 'Pertemuan koordinasi terkait kebijakan energi nasional.', date: new Date(now.getFullYear(), now.getMonth() - 1, 5), location: 'Kementerian ESDM, Jakarta', isInternal: true, status: 'SELESAI' },
  ]

  for (const a of agendas) {
    await prisma.agenda.create({ data: a })
  }
  console.log(`✅ ${agendas.length} agendas seeded`)

  // Create sample pending members
  const members = [
    { fullName: 'Budi Santoso', email: 'budi@company.com', phone: '081234567890', companyName: 'PT Energi Nusantara', position: 'Engineering Manager', memberType: 'Perusahaan', status: 'MENUNGGU', reason: 'Ingin berkontribusi dalam pengembangan industri ketenagalistrikan' },
    { fullName: 'Siti Rahayu', email: 'siti@university.ac.id', phone: '082345678901', companyName: 'Universitas Indonesia', position: 'Dosen', memberType: 'Perguruan Tinggi', status: 'MENUNGGU', reason: 'Kolaborasi riset di bidang energi terbarukan' },
    { fullName: 'Ahmad Wijaya', email: 'ahmad@power.co.id', phone: '083456789012', companyName: 'PT Power Indonesia', position: 'Direktur Teknik', memberType: 'Swasta', status: 'MENUNGGU', reason: 'Meningkatkan jaringan profesional di industri ketenagalistrikan' },
  ]

  for (const m of members) {
    await prisma.member.upsert({ where: { email: m.email }, update: {}, create: m })
  }
  console.log(`✅ ${members.length} pending members seeded`)

  // Create announcements
  await prisma.announcement.createMany({
    data: [
      { title: 'Pendaftaran Keanggotaan Baru Tahun 2025 Telah Dibuka', content: 'Pendaftaran keanggotaan baru ALLIN untuk tahun 2025 telah resmi dibuka.', isForMemberOnly: false },
      { title: 'Jadwal Rapat Pengurus Bulan Ini', content: 'Rapat Pengurus bulan ini akan dilaksanakan pada hari Jumat pukul 09.00 WIB.', isForMemberOnly: true },
    ],
    skipDuplicates: true,
  })
  console.log('✅ Announcements seeded')

  console.log('\n🎉 All sample data seeded successfully!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
