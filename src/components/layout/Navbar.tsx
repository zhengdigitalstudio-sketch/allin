'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import {
  Menu,
  X,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  Shield,
  User,
} from 'lucide-react'
import { useAppStore, type PageKey } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { logout } from './AuthProvider'

interface NavItem {
  label: string
  page: PageKey
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Beranda', page: 'home' },
  { label: 'Tentang', page: 'tentang' },
  { label: 'Visi & Misi', page: 'visi-misi' },
  { label: 'Struktur', page: 'struktur-pengurus' },
  { label: 'Artikel', page: 'artikel' },
  { label: 'Agenda', page: 'agenda' },
  { label: 'Galeri', page: 'galeri' },
  { label: 'Pendaftaran', page: 'pendaftaran' },
  { label: 'Kontak', page: 'kontak' },
]

function getRoleBadgeVariant(role: string) {
  if (role === 'SUPER_ADMIN') return 'bg-red-100 text-red-700 border-red-200'
  if (role === 'KETUA') return 'bg-amber-100 text-amber-700 border-amber-200'
  if (role === 'WAKIL_KETUA') return 'bg-blue-100 text-blue-700 border-blue-200'
  if (role === 'SEKRETARIS') return 'bg-green-100 text-green-700 border-green-200'
  if (role === 'WAKIL_SEKRETARIS') return 'bg-purple-100 text-purple-700 border-purple-200'
  if (role === 'BENDAHARA') return 'bg-orange-100 text-orange-700 border-orange-200'
  return 'bg-gray-100 text-gray-700 border-gray-200'
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
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

function getDashboardPage(role: string): PageKey {
  if (['SUPER_ADMIN', 'KETUA', 'WAKIL_KETUA', 'SEKRETARIS', 'WAKIL_SEKRETARIS', 'BENDAHARA'].includes(role)) {
    return 'admin-dashboard'
  }
  return 'member-dashboard'
}

export function Navbar() {
  const { currentPage, navigate, user } = useAppStore()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 20)
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const isActive = (page: PageKey) => currentPage === page

  // Don't show navbar on dashboard pages
  const isDashboardPage = currentPage.startsWith('admin-') || currentPage.startsWith('pengurus-') || currentPage.startsWith('member-')

  if (isDashboardPage) return null

  const userName = user?.name || ''
  const userRole = user?.role || ''

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled ? 'glass-card-light shadow-lg shadow-allin-green/5' : 'bg-transparent'
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 sm:h-20 items-center justify-between">
            {/* Logo */}
            <button onClick={() => navigate('home')} className="flex items-center gap-2.5 group">
              <Image src="/logo-icon.png" alt="ALLIN Logo" width={512} height={512} priority className="h-9 sm:h-10 w-auto rounded-full" />
            </button>

            {/* Desktop Nav Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.page} label={item.label} active={isActive(item.page)} onClick={() => navigate(item.page)} />
              ))}
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 rounded-full px-2 py-1.5 hover:bg-muted/60 transition-colors cursor-pointer">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-allin-green text-white text-xs font-bold">
                        {getInitials(userName || 'U')}
                      </div>
                      <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate">{userName}</span>
                      <Badge variant="outline" className={cn('hidden md:inline-flex text-[10px] px-1.5 py-0 border', getRoleBadgeVariant(userRole))}>
                        {getRoleLabel(userRole)}
                      </Badge>
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-medium">{userName}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                        <Badge variant="outline" className={cn('w-fit text-[10px] px-1.5 py-0 border', getRoleBadgeVariant(userRole))}>
                          {getRoleLabel(userRole)}
                        </Badge>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate(getDashboardPage(userRole))} className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('home')} className="cursor-pointer">
                      <Shield className="mr-2 h-4 w-4" /> Kembali ke Website
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => logout()} className="cursor-pointer text-red-600 focus:text-red-600">
                      <LogOut className="mr-2 h-4 w-4" /> Keluar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={() => navigate('login')} className="bg-allin-green hover:bg-allin-green-dark text-white rounded-full px-5 font-medium transition-all duration-200 hover:shadow-lg hover:shadow-allin-green/25" size="sm">
                  <User className="mr-1.5 h-4 w-4" /> Masuk
                </Button>
              )}

              {/* Mobile Menu Button */}
              <div className="lg:hidden">
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-allin-green/10">
                      <Menu className="h-5 w-5" /><span className="sr-only">Menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80 sm:w-96 p-0">
                    <SheetTitle className="sr-only">Menu Navigasi</SheetTitle>
                    <div className="flex flex-col h-full">
                      <div className="flex items-center justify-between p-4 border-b border-allin-green/10">
                        <Image src="/logo-icon.png" alt="ALLIN Logo" width={512} height={512} className="h-7 w-auto" />
                        <SheetClose asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><X className="h-4 w-4" /></Button>
                        </SheetClose>
                      </div>
                      <nav className="flex-1 overflow-y-auto py-2">
                        {NAV_ITEMS.map((item) => (
                          <button key={item.page} onClick={() => { navigate(item.page); setMobileOpen(false) }}
                            className={cn('relative w-full text-left px-6 py-3 text-sm font-medium transition-all duration-200',
                              isActive(item.page) ? 'text-allin-green bg-allin-green/5' : 'text-foreground/80 hover:text-allin-green hover:bg-allin-green/5')}>
                            {isActive(item.page) && (
                              <motion.div layoutId="mobile-active" className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-allin-green"
                                transition={{ type: 'spring', stiffness: 380, damping: 30 }} />
                            )}
                            {item.label}
                          </button>
                        ))}
                      </nav>
                      <div className="border-t border-allin-green/10 p-4">
                        {user ? (
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-allin-green text-white text-sm font-bold">
                              {getInitials(userName || 'U')}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{userName}</p>
                              <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 border', getRoleBadgeVariant(userRole))}>
                                {getRoleLabel(userRole)}
                              </Badge>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => logout()} className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50">
                              <LogOut className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button onClick={() => { navigate('login'); setMobileOpen(false) }} className="w-full bg-allin-green hover:bg-allin-green-dark text-white rounded-full font-medium">
                            <User className="mr-1.5 h-4 w-4" /> Masuk
                          </Button>
                        )}
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>
        <div className="h-[2px] bg-gradient-to-r from-allin-green via-allin-green-light to-allin-green" />
      </motion.header>
      <div className="h-16 sm:h-20" />
    </>
  )
}

function NavLink({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={cn('relative px-2.5 py-2 text-sm font-medium transition-colors duration-200 cursor-pointer',
        active ? 'text-allin-green' : 'text-foreground/70 hover:text-allin-green')}>
      {label}
      <AnimatePresence>
        {active && (
          <motion.span layoutId="nav-underline" className="absolute bottom-0 left-1 right-1 h-0.5 rounded-full bg-allin-green"
            initial={{ opacity: 0, scaleX: 0.5 }} animate={{ opacity: 1, scaleX: 1 }} exit={{ opacity: 0, scaleX: 0.5 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }} />
        )}
      </AnimatePresence>
    </button>
  )
}