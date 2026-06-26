'use client'

import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore, type PageKey } from '@/lib/store'

import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { DashboardLayout } from './DashboardLayout'

import HomePage from '@/components/pages/HomePage'
import TentangPage from '@/components/pages/TentangPage'
import VisiMisiPage from '@/components/pages/VisiMisiPage'
import StrukturPengurusPage from '@/components/pages/StrukturPengurusPage'
import ArtikelPage from '@/components/pages/ArtikelPage'
import ArtikelDetailPage from '@/components/pages/ArtikelDetailPage'
import AgendaPage from '@/components/pages/AgendaPage'
import GaleriPage from '@/components/pages/GaleriPage'
import PendaftaranPage from '@/components/pages/PendaftaranPage'
import KontakPage from '@/components/pages/KontakPage'
import FAQPage from '@/components/pages/FAQPage'
import PrivacyPolicyPage from '@/components/pages/PrivacyPolicyPage'
import SitemapPage from '@/components/pages/SitemapPage'
import LoginPage from '@/components/pages/LoginPage'

const AdminDashboardPage = dynamic(
  () => import('@/components/dashboard/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })),
  { ssr: false },
)
const AdminUsersPage = dynamic(
  () => import('@/components/dashboard/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })),
  { ssr: false },
)
const AdminArticlesPage = dynamic(
  () => import('@/components/dashboard/AdminArticlesPage').then((m) => ({ default: m.AdminArticlesPage })),
  { ssr: false },
)
const AdminMembersPage = dynamic(
  () => import('@/components/dashboard/AdminMembersPage').then((m) => ({ default: m.AdminMembersPage })),
  { ssr: false },
)
const AdminAgendaPage = dynamic(
  () => import('@/components/dashboard/AdminAgendaPage').then((m) => ({ default: m.AdminAgendaPage })),
  { ssr: false },
)
const AdminGalleryPage = dynamic(
  () => import('@/components/dashboard/AdminGalleryPage').then((m) => ({ default: m.AdminGalleryPage })),
  { ssr: false },
)
const AdminContactsPage = dynamic(
  () => import('@/components/dashboard/AdminContactsPage').then((m) => ({ default: m.AdminContactsPage })),
  { ssr: false },
)
const AdminBannersPage = dynamic(
  () => import('@/components/dashboard/AdminBannersPage').then((m) => ({ default: m.AdminBannersPage })),
  { ssr: false },
)
const AdminSeoPage = dynamic(
  () => import('@/components/dashboard/AdminSeoPage').then((m) => ({ default: m.AdminSeoPage })),
  { ssr: false },
)
const AdminActivityPage = dynamic(
  () => import('@/components/dashboard/AdminActivityPage').then((m) => ({ default: m.AdminActivityPage })),
  { ssr: false },
)
const AdminBackupPage = dynamic(
  () => import('@/components/dashboard/AdminBackupPage').then((m) => ({ default: m.AdminBackupPage })),
  { ssr: false },
)
const PengurusDashboardPage = dynamic(
  () => import('@/components/dashboard/PengurusDashboardPage').then((m) => ({ default: m.PengurusDashboardPage })),
  { ssr: false },
)
const PengurusArticlesPage = dynamic(
  () => import('@/components/dashboard/PengurusArticlesPage').then((m) => ({ default: m.PengurusArticlesPage })),
  { ssr: false },
)
const PengurusProfilePage = dynamic(
  () => import('@/components/dashboard/PengurusProfilePage').then((m) => ({ default: m.PengurusProfilePage })),
  { ssr: false },
)
const MemberDashboardPage = dynamic(
  () => import('@/components/dashboard/MemberDashboardPage').then((m) => ({ default: m.MemberDashboardPage })),
  { ssr: false },
)
const MemberProfilePage = dynamic(
  () => import('@/components/dashboard/MemberProfilePage').then((m) => ({ default: m.MemberProfilePage })),
  { ssr: false },
)
const MemberDocumentsPage = dynamic(
  () => import('@/components/dashboard/MemberDocumentsPage').then((m) => ({ default: m.MemberDocumentsPage })),
  { ssr: false },
)
const MemberArticlesPage = dynamic(
  () => import('@/components/dashboard/MemberArticlesPage').then((m) => ({ default: m.MemberArticlesPage })),
  { ssr: false },
)
const MemberInboxPage = dynamic(
  () => import('@/components/dashboard/MemberInboxPage').then((m) => ({ default: m.MemberInboxPage })),
  { ssr: false },
)
const MemberAgendaPage = dynamic(
  () => import('@/components/dashboard/MemberAgendaPage').then((m) => ({ default: m.MemberAgendaPage })),
  { ssr: false },
)

const pageComponents: Record<PageKey, React.ComponentType> = {
  home: HomePage,
  tentang: TentangPage,
  'visi-misi': VisiMisiPage,
  'struktur-pengurus': StrukturPengurusPage,
  artikel: ArtikelPage,
  'artikel-detail': ArtikelDetailPage,
  agenda: AgendaPage,
  galeri: GaleriPage,
  pendaftaran: PendaftaranPage,
  kontak: KontakPage,
  faq: FAQPage,
  'privacy-policy': PrivacyPolicyPage,
  sitemap: SitemapPage,
  login: LoginPage,
  'admin-dashboard': AdminDashboardPage,
  'admin-members': AdminMembersPage,
  'admin-articles': AdminArticlesPage,
  'admin-agenda': AdminAgendaPage,
  'admin-gallery': AdminGalleryPage,
  'admin-contacts': AdminContactsPage,
  'admin-users': AdminUsersPage,
  'admin-banners': AdminBannersPage,
  'admin-seo': AdminSeoPage,
  'admin-activity': AdminActivityPage,
  'admin-backup': AdminBackupPage,
  'pengurus-dashboard': PengurusDashboardPage,
  'pengurus-articles': PengurusArticlesPage,
  'pengurus-profile': PengurusProfilePage,
  'member-dashboard': MemberDashboardPage,
  'member-profile': MemberProfilePage,
  'member-documents': MemberDocumentsPage,
  'member-articles': MemberArticlesPage,
  'member-inbox': MemberInboxPage,
  'member-agenda': MemberAgendaPage,
}

function isDashboardPage(page: PageKey): boolean {
  return (
    page.startsWith('admin-') ||
    page.startsWith('pengurus-') ||
    page.startsWith('member-')
  )
}

export function AppRouter() {
  const currentPage = useAppStore((state) => state.currentPage)
  const PageComponent = pageComponents[currentPage]

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [currentPage])

  const pageElement = (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentPage}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <PageComponent />
      </motion.div>
    </AnimatePresence>
  )

  if (currentPage === 'login') {
    return pageElement
  }

  if (isDashboardPage(currentPage)) {
    return <DashboardLayout>{pageElement}</DashboardLayout>
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{pageElement}</main>
      <Footer />
    </div>
  )
}