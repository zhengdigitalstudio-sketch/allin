/**
 * Standalone Turso seed script
 * Inserts seed data into Turso via @libsql/client (bypasses Prisma/Next.js)
 * 
 * Usage: npx tsx scripts/turso-seed.ts
 * 
 * Required env vars: TURSO_DATABASE_URL, TURSO_AUTH_TOKEN
 */

import { createClient } from '@libsql/client'

const url = process.env.TURSO_DATABASE_URL!
const token = process.env.TURSO_AUTH_TOKEN!

if (!url || !token) {
  console.error('❌ TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set')
  process.exit(1)
}

const client = createClient({ url, authToken: token })

// Generate CUID-like IDs (deterministic for seed)
function cuid(prefix: string): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let id = prefix
  for (let i = 0; i < 20; i++) {
    id += chars[Math.floor(Math.random() * chars.length)]
  }
  return id
}

async function seed() {
  console.log('🔄 Connecting to Turso...')
  
  try {
    await client.execute('SELECT 1')
    console.log('✅ Connected to Turso')
    
    // Check existing data
    const existing = await client.execute('SELECT COUNT(*) as cnt FROM "User"')
    const count = Number(existing.rows[0].cnt)
    if (count > 0) {
      console.log(`⚠️  Database already has ${count} user(s). Clearing all data first...`)
      await client.execute('DELETE FROM "Inbox"')
      await client.execute('DELETE FROM "ActivityLog"')
      await client.execute('DELETE FROM "Announcement"')
      await client.execute('DELETE FROM "SeoSettings"')
      await client.execute('DELETE FROM "FileDownload"')
      await client.execute('DELETE FROM "Banner"')
      await client.execute('DELETE FROM "Gallery"')
      await client.execute('DELETE FROM "Article"')
      await client.execute('DELETE FROM "Member"')
      await client.execute('DELETE FROM "User"')
      console.log('  ✅ Cleared')
    }
    
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
    
    // ============ USERS ============
    const users = [
      {
        id: cuid('admin'),
        name: 'Super Admin',
        email: 'admin@allin.web.id',
        password: null,
        role: 'SUPER_ADMIN',
        position: 'Administrator',
        company: 'ALLIN',
        isActive: 1,
      },
      {
        id: cuid('dev'),
        name: 'Developer',
        email: 'zhengdigitalstudio@gmail.com',
        password: null,
        role: 'SUPER_ADMIN',
        position: 'Web Developer',
        company: 'Zheng Digital Studio',
        isActive: 1,
      },
      {
        id: cuid('ketua'),
        name: 'Koespraptini Ria',
        email: 'sampitaria@gmail.com',
        password: null,
        role: 'KETUA',
        position: 'Ketua Umum',
        company: 'PT PLN (Persero)',
        isActive: 1,
      },
      {
        id: cuid('waket'),
        name: 'Mekkadinah',
        email: 'mekkadinah@gmail.com',
        password: null,
        role: 'WAKIL_KETUA',
        position: 'Wakil Ketua Umum',
        company: 'PT PLN (Persero)',
        isActive: 1,
      },
      {
        id: cuid('sek'),
        name: 'Alibeta Sembiring',
        email: 'alelbiwi@gmail.com',
        password: null,
        role: 'SEKRETARIS',
        position: 'Sekretaris Umum',
        company: 'PT PLN (Persero)',
        isActive: 1,
      },
      {
        id: cuid('wsek'),
        name: 'Jaswadi',
        email: 'anjas0875@gmail.com',
        password: null,
        role: 'WAKIL_SEKRETARIS',
        position: 'Wakil Sekretaris',
        company: 'PT PLN (Persero)',
        isActive: 1,
      },
      {
        id: cuid('bend'),
        name: 'Viviane Tazaq',
        email: 'vtanzaq@gmail.com',
        password: null,
        role: 'BENDAHARA',
        position: 'Bendahara',
        company: 'PT PLN (Persero)',
        isActive: 1,
      },
    ]
    
    for (const u of users) {
      await client.execute({
        sql: `INSERT INTO "User" (id, name, email, password, role, position, company, isActive, createdAt, updatedAt) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [u.id, u.name, u.email, u.password, u.role, u.position, u.company, u.isActive, now, now]
      })
    }
    console.log(`  ✅ Users: ${users.length}`)
    
    // ============ ARTICLES ============
    const articles = [
      {
        id: cuid('art1'),
        title: 'ALLIN Gelar Rapat Koordinasi Nasional Tahun 2024',
        slug: 'allin-gelar-rapat-koordinasi-nasional-tahun-2024',
        content: '<p>Asosiasi Lingkungan Industri Ketenagalistrikan Nasional (ALLIN) berhasil menyelenggarakan Rapat Koordinasi Nasional Tahun 2024 yang dihadiri oleh seluruh pengurus dan perwakilan anggota dari berbagai daerah di Indonesia.</p><p>Rapat ini membahas berbagai agenda penting termasuk program kerja tahunan, laporan keuangan, serta strategi pengembangan organisasi ke depan. Ketua Umum ALLIN, Koespraptini Ria, menyampaikan bahwa organisasi harus terus beradaptasi dengan perkembangan industri ketenagalistrikan yang semakin dinamis.</p><p>"Kita harus menjadi mitra strategis pemerintah dan industri dalam mewujudkan ketenagalistrikan nasional yang berkelanjutan," ujar Koespraptini Ria dalam sambutannya.</p><p>Rapat ini juga menghasilkan beberapa keputusan penting terkait penguatan keanggotaan dan pelaksanaan program kerja yang lebih terfokus pada peningkatan kompetensi anggota.</p>',
        excerpt: 'ALLIN berhasil menyelenggarakan Rapat Koordinasi Nasional Tahun 2024 yang membahas program kerja dan strategi pengembangan organisasi.',
        category: 'Berita',
        status: 'PUBLISHED',
        isMemberOnly: 0,
        viewCount: 0,
        authorId: users[2].id,
        publishedAt: '2024-01-15 00:00:00',
      },
      {
        id: cuid('art2'),
        title: 'Peraturan Pemerintah Nomor 25 Tahun 2024 tentang Perubahan Tarif Tenaga Listrik',
        slug: 'peraturan-pemerintah-nomor-25-tahun-2024-tentang-perubahan-tarif-tenaga-listrik',
        content: '<p>Pemerintah telah menerbitkan Peraturan Pemerintah Nomor 25 Tahun 2024 yang mengatur tentang perubahan tarif tenaga listrik untuk berbagai golongan pelanggan. Regulasi ini memberikan dampak signifikan bagi industri ketenagalistrikan di Indonesia.</p><p>Beberapa poin penting dalam regulasi ini meliputi penyesuaian tarif listrik untuk golongan industri besar, insentif tarif untuk penggunaan energi terbarukan, mekanisme penyesuaian tarif secara berkala berdasarkan indeks harga, serta penghapusan subsidi bertahap untuk golongan mampu.</p><p>ALLIN akan terus memantau implementasi regulasi ini dan memberikan masukan kepada pemerintah terkait dampaknya bagi industri.</p>',
        excerpt: 'Analisis mendalam mengenai Peraturan Pemerintah Nomor 25 Tahun 2024 tentang perubahan tarif tenaga listrik dan dampaknya bagi industri.',
        category: 'Regulasi',
        status: 'PUBLISHED',
        isMemberOnly: 0,
        viewCount: 0,
        authorId: users[3].id,
        publishedAt: '2024-02-20 00:00:00',
      },
      {
        id: cuid('art3'),
        title: 'Tren Smart Grid dan Transformasi Digital di Sektor Ketenagalistrikan Indonesia',
        slug: 'tren-smart-grid-dan-transformasi-digital-di-sektor-ketenagalistrikan-indonesia',
        content: '<p>Transformasi digital telah menjadi tren utama di sektor ketenagalistrikan Indonesia. Smart Grid, sebagai sistem jaringan listrik pintar, semakin diadopsi oleh berbagai perusahaan listrik untuk meningkatkan efisiensi dan keandalan distribusi daya.</p><p>Smart Grid adalah sistem jaringan listrik yang menggunakan teknologi informasi dan komunikasi untuk memantau, mengelola, dan mengoptimalkan distribusi daya listrik secara real-time. Teknologi ini memungkinkan integrasi sumber energi terbarukan yang lebih baik.</p><p>PT PLN (Persero) telah memulai implementasi Smart Grid di beberapa kota besar di Indonesia. Beberapa manfaat yang diharapkan antara lain peningkatan efisiensi distribusi daya hingga 15%, pengurangan waktu pemadaman hingga 30%, dan integrasi sumber energi terbarukan yang lebih optimal.</p>',
        excerpt: 'Pelajari tren Smart Grid dan transformasi digital yang sedang mengubah wajah sektor ketenagalistrikan Indonesia menuju era yang lebih efisien.',
        category: 'Teknologi',
        status: 'PUBLISHED',
        isMemberOnly: 0,
        viewCount: 0,
        authorId: users[4].id,
        publishedAt: '2024-03-10 00:00:00',
      },
      {
        id: cuid('art4'),
        title: 'Workshop Peningkatan Kompetensi Teknis Anggota ALLIN',
        slug: 'workshop-peningkatan-kompetensi-teknis-anggota-allin',
        content: '<p>ALLIN telah menyelenggarakan Workshop Peningkatan Kompetensi Teknis yang diikuti oleh lebih dari 100 peserta dari berbagai perusahaan anggota. Workshop ini berlangsung selama dua hari di Jakarta dan menghadirkan para ahli dari industri ketenagalistrikan nasional dan internasional.</p><p>Materi yang disampaikan meliputi teknologi terbaru dalam pembangkitan tenaga listrik, sistem proteksi dan keandalan jaringan transmisi, manajemen aset dan pemeliharaan prediktif, serta standar keselamatan kerja di sektor kelistrikan.</p><p>"Workshop ini merupakan bagian dari komitmen ALLIN untuk meningkatkan kompetensi seluruh anggota agar mampu bersaing di tingkat global," kata Alibeta Sembiring selaku Sekretaris Umum.</p>',
        excerpt: 'Workshop selama dua hari yang diikuti lebih dari 100 peserta untuk meningkatkan kompetensi teknis di sektor ketenagalistrikan.',
        category: 'Kegiatan',
        status: 'PUBLISHED',
        isMemberOnly: 0,
        viewCount: 0,
        authorId: users[5].id,
        publishedAt: '2024-04-05 00:00:00',
      },
      {
        id: cuid('art5'),
        title: 'Masa Depan Energi Terbarukan di Indonesia: Peluang dan Tantangan',
        slug: 'masa-depan-energi-terbarukan-di-indonesia-peluang-dan-tantangan',
        content: '<p>Indonesia memiliki potensi energi terbarukan yang sangat besar, mulai dari energi surya, angin, air, panas bumi, hingga biomassa. Namun, pemanfaatan potensi ini masih menghadapi berbagai tantangan yang perlu diatasi secara sistematis.</p><p>Menurut data Kementerian ESDM, potensi energi terbarukan Indonesia mencapai lebih dari 400 GW, namun yang baru terutilisasi sekitar 12 GW atau kurang dari 3% dari total potensi. Tantangan utama meliputi investasi besar, kerangka regulasi, transfer teknologi, dan integrasi jaringan.</p><p>ALLIN berkomitmen untuk menjadi jembatan antara pemerintah, industri, dan akademisi dalam mewujudkan transisi energi yang berkelanjutan di Indonesia.</p>',
        excerpt: 'Analisis komprehensif mengenai potensi, peluang, dan tantangan pengembangan energi terbarukan di Indonesia serta peran ALLIN dalam transisi energi.',
        category: 'Opini',
        status: 'PUBLISHED',
        isMemberOnly: 0,
        viewCount: 0,
        authorId: users[6].id,
        publishedAt: '2024-05-12 00:00:00',
      },
    ]
    
    for (const a of articles) {
      await client.execute({
        sql: `INSERT INTO "Article" (id, title, slug, content, excerpt, category, status, "isMemberOnly", "viewCount", "authorId", "createdAt", "updatedAt", "publishedAt") 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [a.id, a.title, a.slug, a.content, a.excerpt, a.category, a.status, a.isMemberOnly, a.viewCount, a.authorId, now, now, a.publishedAt]
      })
    }
    console.log(`  ✅ Articles: ${articles.length}`)
    
    // ============ AGENDA ============
    const agendas = [
      {
        id: cuid('agn1'),
        title: 'Musyawarah Nasional ALLIN 2024',
        description: 'Musyawarah Nasional tahunan ALLIN yang akan membahas laporan pertanggungjawaban pengurus, program kerja, serta pemilihan pengurus baru periode 2024-2027.',
        date: '2024-09-15 00:00:00',
        location: 'Hotel Indonesia Kempinski, Jakarta',
        isInternal: 0,
        status: 'AKTIF',
      },
      {
        id: cuid('agn2'),
        title: 'Seminar Nasional Transisi Energi',
        description: 'Seminar nasional yang menghadirkan pembicara dari pemerintah, akademisi, dan praktisi industri untuk membahas strategi transisi energi di Indonesia.',
        date: '2024-07-20 00:00:00',
        location: 'Auditorium PLN, Jakarta',
        isInternal: 0,
        status: 'AKTIF',
      },
      {
        id: cuid('agn3'),
        title: 'Rapat Pengurus Harian Bulanan',
        description: 'Rapat rutin bulanan pengurus harian ALLIN untuk membahas progres program kerja dan isu-isu terkini di industri ketenagalistrikan.',
        date: '2024-06-25 00:00:00',
        location: 'Kantor Sekretariat ALLIN, Jakarta',
        isInternal: 1,
        status: 'AKTIF',
      },
    ]
    
    for (const a of agendas) {
      await client.execute({
        sql: `INSERT INTO "Agenda" (id, title, description, date, location, "isInternal", status, createdAt, updatedAt) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [a.id, a.title, a.description, a.date, a.location, a.isInternal, a.status, now, now]
      })
    }
    console.log(`  ✅ Agenda: ${agendas.length}`)
    
    // ============ GALLERY ============
    const galleries = [
      {
        id: cuid('gal1'),
        title: 'Rapat Koordinasi Nasional 2024',
        description: 'Dokumentasi kegiatan Rapat Koordinasi Nasional ALLIN Tahun 2024 yang dihadiri seluruh pengurus dan perwakilan anggota.',
        imageUrl: '/placeholder-rakornas-2024.jpg',
        category: 'Kegiatan',
      },
      {
        id: cuid('gal2'),
        title: 'Kunjungan Kerja ke PLTU',
        description: 'Kunjungan kerja ALLIN ke Pembangkit Listrik Tenaga Uap (PLTU) untuk mempelajari teknologi terbaru dalam pembangkitan tenaga listrik.',
        imageUrl: '/placeholder-kunjungan-pltu.jpg',
        category: 'Kunjungan',
      },
      {
        id: cuid('gal3'),
        title: 'Sosialisasi Program Kerja 2024',
        description: 'Kegiatan sosialisasi program kerja ALLIN tahun 2024 kepada seluruh anggota melalui pertemuan virtual dan tatap muka.',
        imageUrl: '/placeholder-sosialisasi-2024.jpg',
        category: 'Kegiatan',
      },
    ]
    
    for (const g of galleries) {
      await client.execute({
        sql: `INSERT INTO "Gallery" (id, title, description, "imageUrl", category, createdAt) 
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [g.id, g.title, g.description, g.imageUrl, g.category, now]
      })
    }
    console.log(`  ✅ Gallery: ${galleries.length}`)
    
    // ============ BANNERS ============
    const banners = [
      {
        id: cuid('ban1'),
        title: 'Selamat Datang di ALLIN',
        subtitle: 'Asosiasi Lingkungan Industri Ketenagalistrikan Nasional',
        imageUrl: '/placeholder-banner-1.jpg',
        linkUrl: '/tentang',
        order: 1,
        isActive: 1,
      },
      {
        id: cuid('ban2'),
        title: 'Bergabunglah dengan ALLIN',
        subtitle: 'Wujudkan ketenagalistrikan nasional yang berkelanjutan',
        imageUrl: '/placeholder-banner-2.jpg',
        linkUrl: '/keanggotaan',
        order: 2,
        isActive: 1,
      },
    ]
    
    for (const b of banners) {
      await client.execute({
        sql: `INSERT INTO "Banner" (id, title, subtitle, "imageUrl", "linkUrl", "order", "isActive", createdAt) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [b.id, b.title, b.subtitle, b.imageUrl, b.linkUrl, b.order, b.isActive, now]
      })
    }
    console.log(`  ✅ Banners: ${banners.length}`)
    
    // ============ ANNOUNCEMENTS ============
    const announcements = [
      {
        id: cuid('ann1'),
        title: 'Pendaftaran Keanggotaan Baru Tahun 2024 Telah Dibuka',
        content: 'Dengan ini kami informasikan bahwa pendaftaran keanggotaan baru ALLIN untuk tahun 2024 telah resmi dibuka. Calon anggota dapat mendaftar melalui formulir yang tersedia di website ini. Persyaratan dan prosedur pendaftaran dapat dilihat di halaman keanggotaan.',
        isForMemberOnly: 0,
      },
      {
        id: cuid('ann2'),
        title: 'Jadwal Rapat Pengurus Harian Bulan Juli',
        content: 'Rapat Pengurus Harian bulan Juli 2024 akan dilaksanakan pada hari Jumat, 26 Juli 2024 pukul 09.00 WIB di Ruang Rapat Sekretariat ALLIN. Agenda rapat meliputi evaluasi program kerja semester I dan perencanaan semester II. Mohon seluruh pengurus hadir tepat waktu.',
        isForMemberOnly: 1,
      },
      {
        id: cuid('ann3'),
        title: 'Pembaruan Sistem Keanggotaan Online',
        content: 'Kami informasikan bahwa sistem keanggotaan online ALLIN telah diperbarui. Seluruh anggota diharapkan untuk memperbarui data profil mereka melalui portal anggota. Jika mengalami kendala, silakan hubungi sekretariat.',
        isForMemberOnly: 0,
      },
    ]
    
    for (const a of announcements) {
      await client.execute({
        sql: `INSERT INTO "Announcement" (id, title, content, "isForMemberOnly", createdAt, updatedAt) 
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [a.id, a.title, a.content, a.isForMemberOnly, now, now]
      })
    }
    console.log(`  ✅ Announcements: ${announcements.length}`)
    
    // ============ SEO SETTINGS ============
    await client.execute({
      sql: `INSERT INTO "SeoSettings" (id, page, "metaTitle", "metaDescription", "ogTitle", "ogDescription", "ogImage", "schemaJson", updatedAt) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        cuid('seo'),
        'home',
        'ALLIN - Asosiasi Lingkungan Industri Ketenagalistrikan Nasional',
        'ALLIN adalah organisasi profesi yang menaungi para praktisi dan pelaku industri ketenagalistrikan di Indonesia. Bergabunglah untuk pengembangan kompetensi dan jejaring profesional.',
        'ALLIN - Asosiasi Lingkungan Industri Ketenagalistrikan Nasional',
        'Organisasi profesi ketenagalistrikan nasional yang berkomitmen untuk pengembangan industri dan kompetensi SDM di sektor kelistrikan Indonesia.',
        '/placeholder-og-image.jpg',
        JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'ALLIN',
          alternateName: 'Asosiasi Lingkungan Industri Ketenagalistrikan Nasional',
          url: 'https://allin.web.id',
          description: 'Organisasi profesi yang menaungi para praktisi dan pelaku industri ketenagalistrikan di Indonesia.',
        }),
        now
      ]
    })
    console.log(`  ✅ SEO Settings: 1`)
    
    // ============ ACTIVITY LOG ============
    await client.execute({
      sql: `INSERT INTO "ActivityLog" (id, action, description, "userId", "ipAddress", createdAt) 
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        cuid('log'),
        'SEED_DATABASE',
        'Database di-seed dengan data awal termasuk pengguna, artikel, agenda, galeri, banner, pengumuman, dan pengaturan SEO.',
        users[0].id,
        'system',
        now
      ]
    })
    console.log(`  ✅ Activity Log: 1`)
    
    // ============ VERIFY ============
    console.log('\n📊 Verification:')
    const counts = [
      { table: 'User', label: 'Users' },
      { table: 'Article', label: 'Articles' },
      { table: 'Agenda', label: 'Agenda' },
      { table: 'Gallery', label: 'Gallery' },
      { table: 'Banner', label: 'Banners' },
      { table: 'Announcement', label: 'Announcements' },
      { table: 'SeoSettings', label: 'SEO Settings' },
      { table: 'ActivityLog', label: 'Activity Logs' },
    ]
    
    for (const c of counts) {
      const result = await client.execute(`SELECT COUNT(*) as cnt FROM "${c.table}"`)
      console.log(`  ${c.label}: ${result.rows[0].cnt}`)
    }
    
    console.log('\n✅ Seeding complete!')
  } catch (err: any) {
    console.error('❌ Seed failed:', err.message)
    process.exit(1)
  } finally {
    client.close()
  }
}

seed()