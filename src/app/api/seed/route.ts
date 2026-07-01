import { getSession, PENGURUS_ROLES, APPROVER_ROLES, ARTICLE_CREATE_ROLES, hashPassword } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function POST(request: NextRequest) {
  try {
    // Auth check — only SUPER_ADMIN can seed
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userRole = session?.role || ''
    if (userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden — hanya SUPER_ADMIN' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'

    // Check if users already exist
    const existingUsers = await db.user.count()
    if (existingUsers > 0 && !force) {
      return NextResponse.json({
        error: 'Database sudah memiliki data. Gunakan ?force=true untuk memaksa seeding.',
      }, { status: 400 })
    }

    // If force is true, clear existing data first
    if (force && existingUsers > 0) {
      await db.inbox.deleteMany()
      await db.activityLog.deleteMany()
      await db.announcement.deleteMany()
      await db.seoSettings.deleteMany()
      await db.fileDownload.deleteMany()
      await db.banner.deleteMany()
      await db.gallery.deleteMany()
      await db.contact.deleteMany()
      await db.agenda.deleteMany()
      await db.member.deleteMany()
      await db.article.deleteMany()
      await db.user.deleteMany()
    }

    // Create SUPER_ADMIN
    const adminPw = 'admin123'
    const admin = await db.user.upsert({
      where: { email: 'admin@allin.web.id' },
      update: { password: await hashPassword(adminPw) },
      create: {
        name: 'Super Admin',
        email: 'admin@allin.web.id',
        password: await hashPassword(adminPw),
        role: 'SUPER_ADMIN',
        position: 'Administrator',
        company: 'ALLIN',
        isActive: true,
      },
    })

    // Create Pengurus users
    const pengurusData = [
      {
        name: 'Koespraptini Ria',
        email: 'sampitaria@gmail.com',
        password: 'pengurus123',
        role: 'KETUA',
        position: 'Ketua Umum',
        company: 'PT PLN (Persero)',
      },
      {
        name: 'Mekkadinah',
        email: 'mekkadinah@gmail.com',
        password: 'pengurus123',
        role: 'WAKIL_KETUA',
        position: 'Wakil Ketua Umum',
        company: 'PT PLN (Persero)',
      },
      {
        name: 'Alibeta Sembiring',
        email: 'alelbiwi@gmail.com',
        password: 'pengurus123',
        role: 'SEKRETARIS',
        position: 'Sekretaris Umum',
        company: 'PT PLN (Persero)',
      },
      {
        name: 'Jaswadi',
        email: 'anjas0875@gmail.com',
        password: 'pengurus123',
        role: 'WAKIL_SEKRETARIS',
        position: 'Wakil Sekretaris',
        company: 'PT PLN (Persero)',
      },
      {
        name: 'Viviane Tazaq',
        email: 'vtanzaq@gmail.com',
        password: 'pengurus123',
        role: 'BENDAHARA',
        position: 'Bendahara',
        company: 'PT PLN (Persero)',
      },
    ]

    const pengurus: any[] = []
    for (const p of pengurusData) {
      const hashedPw = await hashPassword(p.password)
      const user = await db.user.upsert({
        where: { email: p.email },
        update: { password: hashedPw },
        create: { ...p, password: hashedPw },
      })
      pengurus.push(user)
    }

    // Create sample articles (one per category)
    const articlesData = [
      {
        title: 'ALLIN Gelar Rapat Koordinasi Nasional Tahun 2024',
        slug: 'allin-gelar-rapat-koordinasi-nasional-tahun-2024',
        content: `<p>Asosiasi Lingkungan Industri Ketenagalistrikan Nasional (ALLIN) berhasil menyelenggarakan Rapat Koordinasi Nasional Tahun 2024 yang dihadiri oleh seluruh pengurus dan perwakilan anggota dari berbagai daerah di Indonesia.</p>
<p>Rapat ini membahas berbagai agenda penting termasuk program kerja tahunan, laporan keuangan, serta strategi pengembangan organisasi ke depan. Ketua Umum ALLIN, Koespraptini Ria, menyampaikan bahwa organisasi harus terus beradaptasi dengan perkembangan industri ketenagalistrikan yang semakin dinamis.</p>
<p>"Kita harus menjadi mitra strategis pemerintah dan industri dalam mewujudkan ketenagalistrikan nasional yang berkelanjutan," ujar Koespraptini Ria dalam sambutannya.</p>
<p>Rapat ini juga menghasilkan beberapa keputusan penting terkait penguatan keanggotaan dan pelaksanaan program kerja yang lebih terfokus pada peningkatan kompetensi anggota.</p>`,
        excerpt: 'ALLIN berhasil menyelenggarakan Rapat Koordinasi Nasional Tahun 2024 yang membahas program kerja dan strategi pengembangan organisasi.',
        category: 'Berita',
        status: 'PUBLISHED',
        isMemberOnly: false,
        authorId: pengurus[0].id,
        publishedAt: new Date('2024-01-15'),
      },
      {
        title: 'Peraturan Pemerintah Nomor 25 Tahun 2024 tentang Perubahan Tarif Tenaga Listrik',
        slug: 'peraturan-pemerintah-nomor-25-tahun-2024-tentang-perubahan-tarif-tenaga-listrik',
        content: `<p>Pemerintah telah menerbitkan Peraturan Pemerintah Nomor 25 Tahun 2024 yang mengatur tentang perubahan tarif tenaga listrik untuk berbagai golongan pelanggan. Regulasi ini memberikan dampak signifikan bagi industri ketenagalistrikan di Indonesia.</p>
<p>Beberapa poin penting dalam regulasi ini meliputi:</p>
<ul>
<li>Penyesuaian tarif listrik untuk golongan industri besar</li>
<li>Insentif tarif untuk penggunaan energi terbarukan</li>
<li>Mekanisme penyesuaian tarif secara berkala berdasarkan indeks harga</li>
<li>Penghapusan subsidi bertahap untuk golongan mampu</li>
</ul>
<p>ALLIN akan terus memantau implementasi regulasi ini dan memberikan masukan kepada pemerintah terkait dampaknya bagi industri.</p>`,
        excerpt: 'Analisis mendalam mengenai Peraturan Pemerintah Nomor 25 Tahun 2024 tentang perubahan tarif tenaga listrik dan dampaknya bagi industri.',
        category: 'Regulasi',
        status: 'PUBLISHED',
        isMemberOnly: false,
        authorId: pengurus[1].id,
        publishedAt: new Date('2024-02-20'),
      },
      {
        title: 'Tren Smart Grid dan Transformasi Digital di Sektor Ketenagalistrikan Indonesia',
        slug: 'tren-smart-grid-dan-transformasi-digital-di-sektor-ketenagalistrikan-indonesia',
        content: `<p>Transformasi digital telah menjadi tren utama di sektor ketenagalistrikan Indonesia. Smart Grid, sebagai sistem jaringan listrik pintar, semakin diadopsi oleh berbagai perusahaan listrik untuk meningkatkan efisiensi dan keandalan distribusi daya.</p>
<h3>Apa itu Smart Grid?</h3>
<p>Smart Grid adalah sistem jaringan listrik yang menggunakan teknologi informasi dan komunikasi untuk memantau, mengelola, dan mengoptimalkan distribusi daya listrik secara real-time. Teknologi ini memungkinkan integrasi sumber energi terbarukan yang lebih baik.</p>
<h3>Implementasi di Indonesia</h3>
<p>PT PLN (Persero) telah memulai implementasi Smart Grid di beberapa kota besar di Indonesia. Program ini mencakup pemasangan smart meter, sistem monitoring jaringan, dan platform manajemen energi berbasis cloud.</p>
<p>Beberapa manfaat yang diharapkan dari implementasi Smart Grid antara lain:</p>
<ul>
<li>Peningkatan efisiensi distribusi daya hingga 15%</li>
<li>Pengurangan waktu pemadaman (outage) hingga 30%</li>
<li>Integrasi sumber energi terbarukan yang lebih optimal</li>
<li>Pemberdayaan konsumen melalui sistem manajemen energi rumah tangga</li>
</ul>`,
        excerpt: 'Pelajari tren Smart Grid dan transformasi digital yang sedang mengubah wajah sektor ketenagalistrikan Indonesia menuju era yang lebih efisien.',
        category: 'Teknologi',
        status: 'PUBLISHED',
        isMemberOnly: false,
        authorId: pengurus[2].id,
        publishedAt: new Date('2024-03-10'),
      },
      {
        title: 'Workshop Peningkatan Kompetensi Teknis Anggota ALLIN',
        slug: 'workshop-peningkatan-kompetensi-teknis-anggota-allin',
        content: `<p>ALLIN telah menyelenggarakan Workshop Peningkatan Kompetensi Teknis yang diikuti oleh lebih dari 100 peserta dari berbagai perusahaan anggota. Workshop ini berlangsung selama dua hari di Jakarta dan menghadirkan para ahli dari industri ketenagalistrikan nasional dan internasional.</p>
<p>Materi yang disampaikan dalam workshop ini meliputi:</p>
<ul>
<li>Teknologi terbaru dalam pembangkitan tenaga listrik</li>
<li>Sistem proteksi dan keandalan jaringan transmisi</li>
<li>Manajemen aset dan pemeliharaan prediktif</li>
<li>Standar keselamatan kerja di sektor kelistrikan</li>
</ul>
<p>"Workshop ini merupakan bagian dari komitmen ALLIN untuk meningkatkan kompetensi seluruh anggota agar mampu bersaing di tingkat global," kata Alibeta Sembiring selaku Sekretaris Umum.</p>
<p>Peserta juga mendapatkan sertifikat kompetensi yang dapat digunakan untuk pengembangan karir profesional di industri ketenagalistrikan.</p>`,
        excerpt: 'Workshop selama dua hari yang diikuti lebih dari 100 peserta untuk meningkatkan kompetensi teknis di sektor ketenagalistrikan.',
        category: 'Kegiatan',
        status: 'PUBLISHED',
        isMemberOnly: false,
        authorId: pengurus[3].id,
        publishedAt: new Date('2024-04-05'),
      },
      {
        title: 'Masa Depan Energi Terbarukan di Indonesia: Peluang dan Tantangan',
        slug: 'masa-depan-energi-terbarukan-di-indonesia-peluang-dan-tantangan',
        content: `<p>Indonesia memiliki potensi energi terbarukan yang sangat besar, mulai dari energi surya, angin, air, panas bumi, hingga biomassa. Namun, pemanfaatan potensi ini masih menghadapi berbagai tantangan yang perlu diatasi secara sistematis.</p>
<h3>Potensi Energi Terbarukan Indonesia</h3>
<p>Menurut data Kementerian ESDM, potensi energi terbarukan Indonesia mencapai lebih dari 400 GW, namun yang baru terutilisasi sekitar 12 GW atau kurang dari 3% dari total potensi. Ini menunjukkan masih besarnya peluang pengembangan ke depan.</p>
<h3>Tantangan Utama</h3>
<ul>
<li><strong>Investasi:</strong> Dibutuhkan investasi besar untuk pembangunan infrastruktur energi terbarukan</li>
<li><strong>Regulasi:</strong> Kerangka regulasi yang mendukung perlu terus diperkuat</li>
<li><strong>Teknologi:</strong> Transfer teknologi dan pengembangan kapasitas lokal masih perlu ditingkatkan</li>
<li><strong>Integrasi Jaringan:</strong> Integrasi energi terbarukan ke dalam jaringan listrik nasional memerlukan perencanaan matang</li>
</ul>
<h3>Peran ALLIN</h3>
<p>ALLIN berkomitmen untuk menjadi jembatan antara pemerintah, industri, dan akademisi dalam mewujudkan transisi energi yang berkelanjutan di Indonesia. Melalui program kerja dan kolaborasi dengan berbagai pemangku kepentingan, ALLIN siap berkontribusi dalam percepatan pengembangan energi terbarukan nasional.</p>`,
        excerpt: 'Analisis komprehensif mengenai potensi, peluang, dan tantangan pengembangan energi terbarukan di Indonesia serta peran ALLIN dalam transisi energi.',
        category: 'Opini',
        status: 'PUBLISHED',
        isMemberOnly: false,
        authorId: pengurus[4].id,
        publishedAt: new Date('2024-05-12'),
      },
    ]

    for (const articleData of articlesData) {
      await db.article.upsert({
        where: { slug: articleData.slug },
        update: {},
        create: articleData,
      })
    }

    // Create sample agenda items
    const agendaData = [
      {
        title: 'Musyawarah Nasional ALLIN 2024',
        description: 'Musyawarah Nasional tahunan ALLIN yang akan membahas laporan pertanggungjawaban pengurus, program kerja, serta pemilihan pengurus baru periode 2024-2027.',
        date: new Date('2024-09-15'),
        location: 'Hotel Indonesia Kempinski, Jakarta',
        isInternal: false,
        status: 'AKTIF',
      },
      {
        title: 'Seminar Nasional Transisi Energi',
        description: 'Seminar nasional yang menghadirkan pembicara dari pemerintah, akademisi, dan praktisi industri untuk membahas strategi transisi energi di Indonesia.',
        date: new Date('2024-07-20'),
        location: 'Auditorium PLN, Jakarta',
        isInternal: false,
        status: 'AKTIF',
      },
      {
        title: 'Rapat Pengurus Harian Bulanan',
        description: 'Rapat rutin bulanan pengurus harian ALLIN untuk membahas progres program kerja dan isu-isu terkini di industri ketenagalistrikan.',
        date: new Date('2024-06-25'),
        location: 'Kantor Sekretariat ALLIN, Jakarta',
        isInternal: true,
        status: 'AKTIF',
      },
    ]

    for (const a of agendaData) {
      await db.agenda.create({ data: a })
    }

    // Create sample gallery items
    const galleryData = [
      {
        title: 'Rapat Koordinasi Nasional 2024',
        description: 'Dokumentasi kegiatan Rapat Koordinasi Nasional ALLIN Tahun 2024 yang dihadiri seluruh pengurus dan perwakilan anggota.',
        imageUrl: '/placeholder-rakornas-2024.jpg',
        category: 'Kegiatan',
      },
      {
        title: 'Kunjungan Kerja ke PLTU',
        description: 'Kunjungan kerja ALLIN ke Pembangkit Listrik Tenaga Uap (PLTU) untuk mempelajari teknologi terbaru dalam pembangkitan tenaga listrik.',
        imageUrl: '/placeholder-kunjungan-pltu.jpg',
        category: 'Kunjungan',
      },
      {
        title: 'Sosialisasi Program Kerja 2024',
        description: 'Kegiatan sosialisasi program kerja ALLIN tahun 2024 kepada seluruh anggota melalui pertemuan virtual dan tatap muka.',
        imageUrl: '/placeholder-sosialisasi-2024.jpg',
        category: 'Kegiatan',
      },
    ]

    for (const g of galleryData) {
      await db.gallery.create({ data: g })
    }

    // Create banners
    const bannerData = [
      {
        title: 'Selamat Datang di ALLIN',
        subtitle: 'Asosiasi Lingkungan Industri Ketenagalistrikan Nasional',
        imageUrl: '/placeholder-banner-1.jpg',
        linkUrl: '/tentang',
        order: 1,
        isActive: true,
      },
      {
        title: 'Bergabunglah dengan ALLIN',
        subtitle: 'Wujudkan ketenagalistrikan nasional yang berkelanjutan',
        imageUrl: '/placeholder-banner-2.jpg',
        linkUrl: '/keanggotaan',
        order: 2,
        isActive: true,
      },
    ]

    for (const b of bannerData) {
      await db.banner.create({ data: b })
    }

    // Create announcements
    const announcementData = [
      {
        title: 'Pendaftaran Keanggotaan Baru Tahun 2024 Telah Dibuka',
        content: 'Dengan ini kami informasikan bahwa pendaftaran keanggotaan baru ALLIN untuk tahun 2024 telah resmi dibuka. Calon anggota dapat mendaftar melalui formulir yang tersedia di website ini. Persyaratan dan prosedur pendaftaran dapat dilihat di halaman keanggotaan.',
        isForMemberOnly: false,
      },
      {
        title: 'Jadwal Rapat Pengurus Harian Bulan Juli',
        content: 'Rapat Pengurus Harian bulan Juli 2024 akan dilaksanakan pada hari Jumat, 26 Juli 2024 pukul 09.00 WIB di Ruang Rapat Sekretariat ALLIN. Agenda rapat meliputi evaluasi program kerja semester I dan perencanaan semester II. Mohon seluruh pengurus hadir tepat waktu.',
        isForMemberOnly: true,
      },
      {
        title: 'Pembaruan Sistem Keanggotaan Online',
        content: 'Kami informasikan bahwa sistem keanggotaan online ALLIN telah diperbarui. Seluruh anggota diharapkan untuk memperbarui data profil mereka melalui portal anggota. Jika mengalami kendala, silakan hubungi sekretariat.',
        isForMemberOnly: false,
      },
    ]

    for (const a of announcementData) {
      await db.announcement.create({ data: a })
    }

    // Create default SEO settings
    await db.seoSettings.upsert({
      where: { page: 'home' },
      update: {},
      create: {
        page: 'home',
        metaTitle: 'ALLIN - Asosiasi Lingkungan Industri Ketenagalistrikan Nasional',
        metaDescription: 'ALLIN adalah organisasi profesi yang menaungi para praktisi dan pelaku industri ketenagalistrikan di Indonesia. Bergabunglah untuk pengembangan kompetensi dan jejaring profesional.',
        ogTitle: 'ALLIN - Asosiasi Lingkungan Industri Ketenagalistrikan Nasional',
        ogDescription: 'Organisasi profesi ketenagalistrikan nasional yang berkomitmen untuk pengembangan industri dan kompetensi SDM di sektor kelistrikan Indonesia.',
        ogImage: '/placeholder-og-image.jpg',
        schemaJson: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'ALLIN',
          alternateName: 'Asosiasi Lingkungan Industri Ketenagalistrikan Nasional',
          url: 'https://allin.web.id',
          description: 'Organisasi profesi yang menaungi para praktisi dan pelaku industri ketenagalistrikan di Indonesia.',
        }),
      },
    })

    // Create activity logs for the seeding action
    await db.activityLog.create({
      data: {
        action: 'SEED_DATABASE',
        description: 'Database di-seed dengan data awal termasuk pengguna, artikel, agenda, galeri, banner, pengumuman, dan pengaturan SEO.',
        userId: admin.id,
        ipAddress: 'system',
      },
    })

    return NextResponse.json({
      message: 'Database berhasil di-seed dengan data awal!',
      data: {
        users: 7, // 2 super admin + 5 pengurus
        articles: 5,
        agenda: 3,
        gallery: 3,
        banners: 2,
        announcements: 3,
        seoSettings: 1,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal melakukan seeding database' }, { status: 500 })
  }
}