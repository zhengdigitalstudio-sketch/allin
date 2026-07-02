import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create SUPER_ADMIN
  const adminPw = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'sadmin@allin.web.id' },
    update: { password: adminPw },
    create: {
      name: 'Super Admin',
      email: 'sadmin@allin.web.id',
      password: adminPw,
      role: 'SUPER_ADMIN',
      position: 'Administrator',
      company: 'ALLIN',
      isActive: true,
    },
  })
  console.log('✅ Super Admin created:', admin.email)

  // Create Pengurus
  const pengurusData = [
    { name: 'Koespraptini Ria', email: 'sampitaria@gmail.com', password: 'pengurus123', role: 'KETUA', position: 'Ketua Umum', company: 'PT PLN (Persero)' },
    { name: 'Mekkadinah', email: 'mekkadinah@gmail.com', password: 'pengurus123', role: 'WAKIL_KETUA', position: 'Wakil Ketua Umum', company: 'PT PLN (Persero)' },
    { name: 'Alibeta Sembiring', email: 'alelbiwi@gmail.com', password: 'pengurus123', role: 'SEKRETARIS', position: 'Sekretaris Umum', company: 'PT PLN (Persero)' },
    { name: 'Jaswadi', email: 'anjas0875@gmail.com', password: 'pengurus123', role: 'WAKIL_SEKRETARIS', position: 'Wakil Sekretaris', company: 'PT PLN (Persero)' },
    { name: 'Viviane Tazaq', email: 'vtanzaq@gmail.com', password: 'pengurus123', role: 'BENDAHARA', position: 'Bendahara', company: 'PT PLN (Persero)' },
  ]

  for (const p of pengurusData) {
    const hashed = await bcrypt.hash(p.password, 12)
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: { password: hashed },
      create: { ...p, password: hashed },
    })
    console.log('✅ Pengurus created:', user.email, '(' + p.role + ')')
  }

  console.log('\n✅ Seeding complete! 6 accounts ready.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
