'use client'

import { logout } from './AuthProvider'
import {
  LayoutDashboard,
  Users,
  FileText,
  UserCheck,
  CalendarDays,
  Image,
  MessageSquare,
  LayoutGrid,
  Search,
  Activity,
  Database,
  ArrowLeft,
  LogOut,
  PenLine,
  UserCircle,
  FileStack,
  Inbox,
  type LucideIcon,
} from 'lucide-react'
import { useAppStore, type PageKey, PENGURUS_ROLES } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'

interface SidebarItem {
  label: string
  page: PageKey
  icon: LucideIcon
}

const SUPER_ADMIN_MENU: SidebarItem[] = [
  { label: 'Dashboard', page: 'admin-dashboard', icon: LayoutDashboard },
  { label: 'Manajemen User', page: 'admin-users', icon: Users },
  { label: 'Manajemen Artikel', page: 'admin-articles', icon: FileText },
  { label: 'Manajemen Member', page: 'admin-members', icon: UserCheck },
  { label: 'Manajemen Agenda', page: 'admin-agenda', icon: CalendarDays },
  { label: 'Manajemen Galeri', page: 'admin-gallery', icon: Image },
  { label: 'Kontak Masuk', page: 'admin-contacts', icon: MessageSquare },
  { label: 'Banner', page: 'admin-banners', icon: LayoutGrid },
  { label: 'SEO', page: 'admin-seo', icon: Search },
  { label: 'Activity Log', page: 'admin-activity', icon: Activity },
  { label: 'Backup', page: 'admin-backup', icon: Database },
]

const PENGURUS_MENU: SidebarItem[] = [
  { label: 'Dashboard', page: 'pengurus-dashboard', icon: LayoutDashboard },
  { label: 'Artikel Saya', page: 'pengurus-articles', icon: PenLine },
  { label: 'Profil', page: 'pengurus-profile', icon: UserCircle },
]

const MEMBER_MENU: SidebarItem[] = [
  { label: 'Dashboard', page: 'member-dashboard', icon: LayoutDashboard },
  { label: 'Profil', page: 'member-profile', icon: UserCircle },
  { label: 'Dokumen', page: 'member-documents', icon: FileStack },
  { label: 'Artikel', page: 'member-articles', icon: FileText },
  { label: 'Agenda Internal', page: 'member-agenda', icon: CalendarDays },
  { label: 'Pesan', page: 'member-inbox', icon: Inbox },
]

function getRoleBadgeClasses(role: string): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'bg-red-100 text-red-700 border-red-200'
    case 'KETUA':
      return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'WAKIL_KETUA':
      return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'SEKRETARIS':
      return 'bg-green-100 text-green-700 border-green-200'
    case 'WAKIL_SEKRETARIS':
      return 'bg-purple-100 text-purple-700 border-purple-200'
    case 'BENDAHARA':
      return 'bg-orange-100 text-orange-700 border-orange-200'
    case 'MEMBER':
      return 'bg-gray-100 text-gray-600 border-gray-200'
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200'
  }
}

function getRoleLabel(role: string): string {
  const map: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    KETUA: 'Ketua',
    WAKIL_KETUA: 'Wakil Ketua',
    SEKRETARIS: 'Sekretaris',
    WAKIL_SEKRETARIS: 'Wakil Sekretaris',
    BENDAHARA: 'Bendahara',
    MEMBER: 'Member',
  }
  return map[role] || role
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function getAvatarBg(role: string): string {
  if (role === 'SUPER_ADMIN') return 'bg-red-500'
  if (role === 'KETUA') return 'bg-amber-500'
  if (role === 'WAKIL_KETUA') return 'bg-blue-500'
  if (role === 'SEKRETARIS') return 'bg-allin-green'
  if (role === 'WAKIL_SEKRETARIS') return 'bg-purple-500'
  if (role === 'BENDAHARA') return 'bg-orange-500'
  return 'bg-allin-green'
}

function getMenuForRole(role: string): SidebarItem[] {
  if (role === 'SUPER_ADMIN') return SUPER_ADMIN_MENU
  if (PENGURUS_ROLES.includes(role as any)) return PENGURUS_MENU
  return MEMBER_MENU
}

interface DashboardSidebarProps {
  role: string
  userName: string
  userRole: string
}

export function DashboardSidebar({ role, userName, userRole }: DashboardSidebarProps) {
  const { currentPage, navigate } = useAppStore()
  const menuItems = getMenuForRole(role)

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-border">
      {/* User Profile Section */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white text-sm font-bold shadow-sm',
              getAvatarBg(role)
            )}
          >
            {getInitials(userName || 'U')}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">{userName}</p>
            <Badge
              variant="outline"
              className={cn('text-[10px] px-1.5 py-0 mt-1 border font-medium', getRoleBadgeClasses(role))}
            >
              {getRoleLabel(userRole || role)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-3">
        <nav className="px-3 space-y-0.5">
          {menuItems.map((item) => {
            const active = currentPage === item.page
            return (
              <button
                key={item.page}
                onClick={() => navigate(item.page)}
                className={cn(
                  'group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer',
                  active
                    ? 'bg-allin-green/8 text-allin-green'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {/* Active left border indicator */}
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-allin-green" />
                )}
                <item.icon
                  className={cn(
                    'h-4.5 w-4.5 shrink-0 transition-colors',
                    active ? 'text-allin-green' : 'text-muted-foreground group-hover:text-foreground'
                  )}
                />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Bottom Section */}
      <div className="p-3 border-t border-border space-y-1">
        <button
          onClick={() => navigate('home')}
          className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 cursor-pointer"
        >
          <ArrowLeft className="h-4.5 w-4.5 shrink-0" />
          Kembali ke Website
        </button>
        <Separator className="my-1" />
        <button
          onClick={() => logout()}
          className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 cursor-pointer"
        >
          <LogOut className="h-4.5 w-4.5 shrink-0" />
          Keluar
        </button>
      </div>
    </div>
  )

  return sidebarContent
}