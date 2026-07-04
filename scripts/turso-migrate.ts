/**
 * Standalone Turso migration script
 * Creates all tables in Turso via @libsql/client (bypasses Prisma CLI)
 * 
 * Usage: npx tsx scripts/turso-migrate.ts
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

const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "password" TEXT,
  "role" TEXT NOT NULL DEFAULT 'MEMBER',
  "avatar" TEXT,
  "phone" TEXT,
  "position" TEXT,
  "company" TEXT,
  "bio" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT 1,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

CREATE TABLE IF NOT EXISTS "Article" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "content" TEXT,
  "excerpt" TEXT,
  "coverImage" TEXT,
  "category" TEXT NOT NULL DEFAULT 'Berita',
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "isMemberOnly" BOOLEAN NOT NULL DEFAULT 0,
  "viewCount" INTEGER NOT NULL DEFAULT 0,
  "metaTitle" TEXT,
  "metaDescription" TEXT,
  "authorId" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  "publishedAt" DATETIME,
  CONSTRAINT "Article_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Article_slug_key" ON "Article"("slug");

CREATE TABLE IF NOT EXISTS "Member" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "fullName" TEXT NOT NULL,
  "companyName" TEXT,
  "institution" TEXT,
  "position" TEXT,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "address" TEXT,
  "city" TEXT,
  "province" TEXT,
  "memberType" TEXT NOT NULL DEFAULT 'Perorangan',
  "logo" TEXT,
  "photo" TEXT,
  "document" TEXT,
  "reason" TEXT,
  "status" TEXT NOT NULL DEFAULT 'MENUNGGU',
  "userId" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Member_email_key" ON "Member"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "Member_userId_key" ON "Member"("userId");

CREATE TABLE IF NOT EXISTS "Contact" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "subject" TEXT,
  "message" TEXT NOT NULL,
  "isRead" BOOLEAN NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Agenda" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "date" DATETIME NOT NULL,
  "location" TEXT,
  "coverImage" TEXT,
  "isInternal" BOOLEAN NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'AKTIF',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "Gallery" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "imageUrl" TEXT NOT NULL,
  "category" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Banner" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "subtitle" TEXT,
  "imageUrl" TEXT NOT NULL,
  "linkUrl" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT 1,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "FileDownload" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "fileName" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "fileSize" INTEGER,
  "downloadCount" INTEGER NOT NULL DEFAULT 0,
  "isForMemberOnly" BOOLEAN NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ActivityLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "action" TEXT NOT NULL,
  "description" TEXT,
  "userId" TEXT NOT NULL,
  "ipAddress" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "SeoSettings" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "page" TEXT NOT NULL,
  "metaTitle" TEXT NOT NULL,
  "metaDescription" TEXT NOT NULL,
  "ogTitle" TEXT,
  "ogDescription" TEXT,
  "ogImage" TEXT,
  "schemaJson" TEXT,
  "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "SeoSettings_page_key" ON "SeoSettings"("page");

CREATE TABLE IF NOT EXISTS "Announcement" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "content" TEXT,
  "isForMemberOnly" BOOLEAN NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "Inbox" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "senderId" TEXT,
  "senderName" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "content" TEXT,
  "receiverId" TEXT NOT NULL,
  "isRead" BOOLEAN NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`

async function migrate() {
  console.log('🔄 Connecting to Turso...')
  
  try {
    // Test connection
    await client.execute('SELECT 1')
    console.log('✅ Connected to Turso')
    
    // Execute each statement
    const statements = CREATE_TABLES_SQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)
    
    for (let i = 0; i < statements.length; i++) {
      // Skip index/constraint-only lines that don't need separate execution
      const stmt = statements[i]
      if (stmt.startsWith('CREATE UNIQUE INDEX') || stmt.startsWith('CONSTRAINT')) {
        continue
      }
      try {
        await client.execute(stmt)
        const tableName = stmt.match(/CREATE TABLE IF NOT EXISTS "(\w+)"/)?.[1] || 'unknown'
        console.log(`  ✅ ${tableName}`)
      } catch (err: any) {
        console.error(`  ❌ Error: ${err.message}`)
      }
    }
    
    // Verify tables
    const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    console.log(`\n📋 Tables in Turso (${tables.rows.length}):`)
    for (const row of tables.rows) {
      console.log(`  - ${row.name}`)
    }
    
    console.log('\n✅ Migration complete!')
  } catch (err: any) {
    console.error('❌ Migration failed:', err.message)
    process.exit(1)
  } finally {
    client.close()
  }
}

migrate()