'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChevronRight,
  Search,
  FileText,
  Download,
  Calendar,
  HardDrive,
  Eye,
  Filter,
  X,
  Lock,
  Globe,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

// Types
interface Regulasi {
  id: string
  title: string
  description: string | null
  category: string
  fileName: string
  fileUrl: string
  fileSize: number
  mimeType: string
  publicId: string
  status: string
  isForMemberOnly: boolean
  downloadCount: number
  author: { name: string } | null
  createdAt: string
  updatedAt: string
}

interface CategoryCount {
  category: string
  count: number
}

const CATEGORIES = ['Semua', 'Umum', 'Lingkungan', 'K3', 'Teknologi', 'Hukum', 'Keuangan', 'SDM']

// Format file size
function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / log(k))
  return parseFloat((bytes / pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Helper functions to avoid math issues
function log(x: number): number {
  return Math.log(x)
}

function pow(base: number, exp: number): number {
  return Math.pow(base, exp)
}

// Get category color
function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    'Umum': 'bg-blue-100 text-blue-700 border-blue-200',
    'Lingkungan': 'bg-green-100 text-green-700 border-green-200',
    'K3': 'bg-orange-100 text-orange-700 border-orange-200',
    'Teknologi': 'bg-purple-100 text-purple-700 border-purple-200',
    'Hukum': 'bg-red-100 text-red-700 border-red-200',
    'Keuangan': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'SDM': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  }
  return colors[category] || 'bg-gray-100 text-gray-700 border-gray-200'
}

export default function RegulasiPage() {
  const { navigate } = useAppStore()
  const [regulasiList, setRegulasiList] = useState<Regulasi[]>([])
  const [categoryCounts, setCategoryCounts] = useState<CategoryCount[]>([])
  const [activeCategory, setActiveCategory] = useState('Semua')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)

  // Fetch regulasi data
  const fetchRegulasi = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('status', 'PUBLISHED')
      if (activeCategory !== 'Semua') params.set('category', activeCategory)
      if (search) params.set('search', search)

      const res = await fetch(`/api/regulasi?${params}`)
      const data = await res.json()
      
      if (!Array.isArray(data)) {
        console.error('Unexpected API response:', data)
        setRegulasiList([])
      } else {
        setRegulasiList(data)
      }
    } catch (error) {
      console.error('Error fetching regulasi:', error)
      setRegulasiList([])
    } finally {
      setLoading(false)
    }
  }, [activeCategory, search])

  // Fetch category counts
  const fetchCategoryCounts = useCallback(async () => {
    try {
      const res = await fetch('/api/regulasi?status=PUBLISHED')
      const data = await res.json()
      
      if (Array.isArray(data)) {
        const counts: Record<string, number> = {}
        data.forEach((r: Regulasi) => {
          counts[r.category] = (counts[r.category] || 0) + 1
        })
        setCategoryCounts(
          Object.entries(counts)
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count)
        )
      }
    } catch (error) {
      console.error('Error fetching category counts:', error)
    }
  }, [])

  useEffect(() => {
    fetchRegulasi()
  }, [fetchRegulasi])

  useEffect(() => {
    fetchCategoryCounts()
  }, [fetchCategoryCounts])

  // Handle search
  const handleSearch = () => {
    setSearch(searchInput)
  }

  // Handle download with count increment
  const handleDownload = async (regulasi: Regulasi) => {
    try {
      // Increment download count
      await fetch(`/api/regulasi/${regulasi.id}/download`, { method: 'POST' })
    } catch (error) {
      console.error('Failed to increment download count:', error)
    }
    
    // Open file in new tab for download
    window.open(regulasi.fileUrl, '_blank')
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-hero py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-allin-green/20 via-transparent to-allin-green-light/10" />
        <div className="container mx-auto px-4 relative z-10">
          <nav className="flex items-center gap-2 text-sm text-white/60 mb-6 animate-fade-in-down">
            <button onClick={() => navigate('home')} className="hover:text-white transition-colors">
              Beranda
            </button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">Regulasi</span>
          </nav>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white">
                Regulasi
              </h1>
            </div>
            
            <p className="text-white/80 text-lg max-w-2xl mb-8">
              Kumpulan dokumen regulasi, kebijakan, dan standar yang berlaku untuk industri ketenagalistrikan.
              Unduh dokumen yang Anda butuhkan.
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="max-w-xl"
          >
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cari regulasi..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 bg-white/95"
                />
              </div>
              {search && (
                <Button variant="ghost" size="icon" onClick={() => { setSearchInput(''); setSearch('') }}>
                  <X className="w-4 h-4" />
                </Button>
              )}
              <Button 
                onClick={handleSearch} 
                className="bg-white text-allin-green hover:bg-gray-100 font-medium"
              >
                <Search className="w-4 h-4 mr-1.5" />
                Cari
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Category Filters */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Filter Kategori</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <Button
                      key={cat}
                      variant={activeCategory === cat ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveCategory(cat)}
                      className={cn(
                        activeCategory === cat
                          ? 'bg-allin-green hover:bg-allin-green-dark text-white'
                          : 'border-border hover:border-allin-green hover:text-allin-green'
                      )}
                    >
                      {cat}
                      {cat !== 'Semua' && (
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            'ml-1.5 text-[10px] px-1.5',
                            activeCategory === cat ? 'bg-white/20 text-white' : ''
                          )}
                        >
                          {categoryCounts.find(c => c.category === cat)?.count || 0}
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Results Count */}
              {!loading && (
                <div className="mb-4 text-sm text-muted-foreground">
                  Menampilkan <span className="font-semibold text-foreground">{regulasiList.length}</span> dokumen
                  {activeCategory !== 'Semua' && (
                    <span> dalam kategori <span className="font-semibold text-allin-green">{activeCategory}</span></span>
                  )}
                  {search && (
                    <span> untuk pencarian <span className="font-semibold text-allin-green">&quot;{search}&quot;</span></span>
                  )}
                </div>
              )}

              {/* Loading State */}
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-40 rounded-xl" />
                  ))}
                </div>
              ) : regulasiList.length === 0 ? (
                /* Empty State */
                <Card className="p-12 text-center">
                  <FileText className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Belum Ada Regulasi</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Tidak ditemukan dokumen regulasi{activeCategory !== 'Semua' ? ` dalam kategori "${activeCategory}"` : ''}.
                    Coba ubah filter atau kata kunci pencarian Anda.
                  </p>
                </Card>
              ) : (
                /* Regulasi List */
                <div className="space-y-4">
                  {regulasiList.map((regulasi, i) => (
                    <motion.div
                      key={regulasi.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.05 }}
                    >
                      <Card className="hover:shadow-md transition-all duration-200 overflow-hidden group border-0 shadow-sm">
                        <CardContent className="p-0">
                          <div className="flex flex-col sm:flex-row">
                            {/* Icon/Preview */}
                            <div className="sm:w-40 h-32 sm:h-auto flex-shrink-0 relative overflow-hidden bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                              <FileText className="w-12 h-12 text-white/50" />
                              <Badge className="absolute top-2 left-2 bg-white/20 text-white border-0 text-[10px] font-semibold backdrop-blur-sm">
                                PDF
                              </Badge>
                              {regulasi.isForMemberOnly && (
                                <div className="absolute top-2 right-2">
                                  <Lock className="w-4 h-4 text-white/80" />
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 p-4 sm:p-5 min-w-0">
                              <div className="flex items-start gap-2 mb-2">
                                <h3 className="font-bold text-base line-clamp-2 group-hover:text-allin-green transition-colors flex-1">
                                  {regulasi.title}
                                </h3>
                                <Badge 
                                  variant="outline" 
                                  className={cn('text-[10px] font-semibold shrink-0', getCategoryColor(regulasi.category))}
                                >
                                  {regulasi.category}
                                </Badge>
                              </div>

                              {regulasi.description && (
                                <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                                  {regulasi.description}
                                </p>
                              )}

                              {/* Meta Info */}
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground mb-3">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {format(new Date(regulasi.createdAt), 'dd MMM yyyy', { locale: localeId })}
                                </span>
                                <span className="flex items-center gap-1">
                                  <HardDrive className="w-3 h-3" />
                                  {formatFileSize(regulasi.fileSize)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  {regulasi.downloadCount} unduhan
                                </span>
                                {regulasi.author?.name && (
                                  <span>Oleh {regulasi.author.name}</span>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-3">
                                <Button
                                  size="sm"
                                  className="bg-allin-green hover:bg-allin-green-dark text-white font-medium shadow-sm hover:shadow-md transition-all"
                                  onClick={() => handleDownload(regulasi)}
                                >
                                  <Download className="w-4 h-4 mr-1.5" />
                                  Unduh PDF
                                </Button>
                                
                                <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                  {regulasi.fileName}
                                </span>

                                {regulasi.isForMemberOnly && (
                                  <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700">
                                    <Lock className="w-3 h-3 mr-1" />
                                    Member Only
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="w-full lg:w-80 flex-shrink-0 space-y-6">
              {/* Categories Summary */}
              <div className="bg-muted/50 rounded-xl p-5">
                <h3 className="font-bold text-base mb-4 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-allin-green" />
                  Kategori
                </h3>
                {categoryCounts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada data.</p>
                ) : (
                  <div className="space-y-2">
                    {categoryCounts.map((item) => (
                      <button
                        key={item.category}
                        onClick={() => setActiveCategory(item.category)}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
                          activeCategory === item.category
                            ? 'bg-allin-green text-white font-medium'
                            : 'hover:bg-allin-green/10 text-muted-foreground hover:text-allin-green'
                        )}
                      >
                        <span>{item.category}</span>
                        <Badge
                          variant="secondary"
                          className={cn(
                            'text-xs',
                            activeCategory === item.category && 'bg-white/20 text-white'
                          )}
                        >
                          {item.count}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Info Card */}
              <div className="bg-gradient-to-br from-allin-green/10 to-allin-green-light/5 rounded-xl p-5 border border-allin-green/20">
                <h3 className="font-bold text-base mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-allin-green" />
                  Informasi
                </h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    Dokumen regulasi ini disediakan untuk keperluan informasi publik. 
                    Beberapa dokumen mungkin hanya dapat diakses oleh anggota terdaftar.
                  </p>
                  <div className="pt-2 border-t border-allin-green/10">
                    <p className="text-xs font-medium text-allin-green">
                      Total: {regulasiList.length} dokumen tersedia
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  )
}
