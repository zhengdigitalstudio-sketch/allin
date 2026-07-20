'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Download, FileText, Filter, Calendar, Lock, Globe, LogIn } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

const REGULASI_CATEGORIES = ['SEMUA', 'Umum', 'Lingkungan', 'K3', 'Teknologi', 'Hukum', 'Keuangan', 'SDM']

interface RegulasiItem {
  id: string
  title: string
  description: string | null
  category: string
  fileName: string
  fileSize: number
  mimeType: string
  status: string
  isForMemberOnly: boolean
  downloadCount: number
  createdAt: string
  author: { id: string; name: string }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function RegulasiPage() {
  const [regulasiList, setRegulasiList] = useState<RegulasiItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('SEMUA')
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const fetchRegulasi = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (categoryFilter !== 'SEMUA') params.set('category', categoryFilter)
      if (search) params.set('search', search)
      
      const res = await fetch(`/api/regulasi?${params}`)
      if (res.ok) {
        const data = await res.json()
        setRegulasiList(Array.isArray(data) ? data : data.regulasi || [])
        // Check if user is authenticated from response
        if (data.isAuthenticated !== undefined) {
          setIsAuthenticated(data.isAuthenticated)
        }
      }
    } catch (err) {
      console.error('Fetch regulasi error:', err)
      setRegulasiList([])
    } finally {
      setLoading(false)
    }
  }, [search, categoryFilter])

  useEffect(() => {
    fetchRegulasi()
  }, [fetchRegulasi])

  // Also check auth status on mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) setIsAuthenticated(true)
      })
      .catch(() => {})
  }, [])

  const handleDownload = async (item: RegulasiItem) => {
    // Check if member-only and not authenticated
    if (item.isForMemberOnly && !isAuthenticated) {
      toast.error('Login diperlukan untuk mendownload dokumen ini')
      // Redirect to login or show login prompt
      window.location.href = '/?page=login&redirect=regulasi'
      return
    }

    setDownloadingId(item.id)
    try {
      const res = await fetch(`/api/regulasi/${item.id}?download=true`)
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = item.fileName
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('File berhasil diunduh')
        
        // Update download count locally
        setRegulasiList(prev => prev.map(r => 
          r.id === item.id ? { ...r, downloadCount: r.downloadCount + 1 } : r
        ))
      } else if (res.status === 401) {
        toast.error('Login diperlukan untuk mendownload dokumen ini')
      } else {
        toast.error('Gagal mendownload file')
      }
    } catch {
      toast.error('Gagal mendownload file')
    } finally {
      setDownloadingId(null)
    }
  }

  // Count member-only items that user can't access
  const memberOnlyCount = regulasiList.filter(r => r.isForMemberOnly && !isAuthenticated).length

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50/30 to-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black py-12 md:py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              📋 Dokumen Regulasi
            </h1>
            <p className="text-lg opacity-90">
              Unduh dokumen regulasi resmi yang berlaku di organisasi kami
            </p>
            
            {/* Member-only notice */}
            {!isAuthenticated && (
              <div className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 text-sm">
                <Lock className="h-4 w-4" />
                <span>Beberapa dokumen hanya tersedia untuk anggota</span>
                <Button 
                  size="sm" 
                  variant="secondary" 
                  className="ml-2 bg-white text-yellow-700 hover:bg-white/90"
                  onClick={() => window.location.href = '/?page=login'}
                >
                  <LogIn className="h-3 w-3 mr-1" />
                  Login sebagai Anggota
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="container mx-auto px-4 py-8 md:py-12">
        {/* Filters */}
        <Card className="mb-6 border-yellow-200 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari regulasi..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Kategori">
                    <span className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      Kategori
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {REGULASI_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat === 'SEMUA' ? 'Semua Kategori' : cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Member-only notice banner */}
        {memberOnlyCount > 0 && !isAuthenticated && (
          <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-purple-800 dark:text-purple-200">
                  {memberOnlyCount} dokumen{memberOnlyCount > 1 ? '' : ''} hanya untuk anggota
                </p>
                <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                  Login sebagai anggota untuk mengakses semua dokumen regulasi.
                </p>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="mt-2 border-purple-300 text-purple-700 hover:bg-purple-100"
                  onClick={() => window.location.href = '/?page=login'}
                >
                  <LogIn className="h-4 w-4 mr-1" />
                  Login Sekarang
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-5">
                  <Skeleton className="h-5 w-3/4 mb-3" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <div className="flex justify-between">
                    <Skeleton className="h-8 w-24 rounded" />
                    <Skeleton className="h-8 w-28 rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : regulasiList.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <FileText className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Belum Ada Regulasi</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Dokumen regulasi belum tersedia. Silakan kembali lagi nanti.
            </p>
          </motion.div>
        ) : (
          /* Regulasi Grid */
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {regulasiList.map((item, index) => {
              const isMemberOnly = item.isForMemberOnly && !isAuthenticated
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className={cn(
                    "group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden",
                    isMemberOnly 
                      ? "border-purple-200 bg-purple-50/50" 
                      : "border-border/50 hover:border-yellow-300"
                  )}>
                    <CardContent className="p-5">
                      {/* Header */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                          isMemberOnly 
                            ? "bg-purple-100 group-hover:bg-purple-200" 
                            : "bg-red-100 group-hover:bg-red-200"
                        )}>
                          <FileText className={cn(
                            "h-5 w-5",
                            isMemberOnly ? "text-purple-600" : "text-red-600"
                          )} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-2">
                            <h3 className={cn(
                              "font-semibold text-base line-clamp-2 transition-colors",
                              isMemberOnly ? "text-purple-900" : "group-hover:text-yellow-700"
                            )}>
                              {item.title}
                            </h3>
                          </div>
                        </div>
                        
                        {/* Visibility Badge */}
                        {item.isForMemberOnly && (
                          <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-[10px] shrink-0">
                            <Lock className="h-3 w-3 mr-1" />
                            Member
                          </Badge>
                        )}
                      </div>

                      {/* Description */}
                      {item.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {item.description}
                        </p>
                      )}

                      {/* Meta Info */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant="outline" className="text-[10px]">
                          {item.category}
                        </Badge>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(item.createdAt)}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Download className="h-3 w-3" />
                          {formatFileSize(item.fileSize)}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-3 border-t">
                        <span className="text-xs text-muted-foreground">
                          {item.downloadCount} unduhan
                        </span>
                        <Button
                          size="sm"
                          onClick={() => handleDownload(item)}
                          disabled={downloadingId === item.id}
                          className={
                            isMemberOnly
                              ? "bg-purple-500 hover:bg-purple-600 text-white"
                              : "bg-yellow-500 hover:bg-yellow-600 text-black"
                          }
                        >
                          {downloadingId === item.id ? (
                            <>
                              <span className="animate-spin mr-1">⏳</span>
                              Mendownload...
                            </>
                          ) : isMemberOnly ? (
                            <>
                              <LogIn className="h-4 w-4 mr-1" />
                              Login & Unduh
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-1" />
                              Unduh PDF
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Member-only overlay hint */}
                      {isMemberOnly && (
                        <div className="mt-3 p-2 bg-purple-100/50 rounded text-xs text-purple-600 text-center">
                          🔒 Dokumen eksklusif untuk anggota terdaftar
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </section>

      {/* Footer Note */}
      <section className="bg-muted/50 py-8 mt-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Dokumen regulasi ini disediakan untuk keperluan informasi. 
            Untuk pertanyaan lebih lanjut, silakan hubungi admin.
          </p>
          
          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Globe className="h-3 w-3 text-green-600" />
              Publik - Semua orang bisa akses
            </span>
            <span className="flex items-center gap-1">
              <Lock className="h-3 w-3 text-purple-600" />
              Member Only - Hanya anggota
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}
