'use client'

import { useState, useEffect } from 'react'
import { Search, Download, FileText, Calendar, Filter } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface Regulasi {
  id: string
  title: string
  description: string | null
  fileName: string | null
  fileSize: number | null
  category: string
  status: string
  downloadCount: number
  createdAt: string
}

const REGULASI_CATEGORIES = ['SEMUA', 'Umum', 'PLN', 'Ketenagalistrikan', 'Lingkungan', 'Energi', 'Keselamatan', 'SDM']

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export function RegulasiPage() {
  const [regulasiList, setRegulasiList] = useState<Regulasi[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('SEMUA')
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  useEffect(() => {
    fetchRegulasi()
  }, [])

  const fetchRegulasi = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/regulasi?status=PUBLISHED')
      if (res.ok) {
        const data = await res.json()
        setRegulasiList(Array.isArray(data) ? data : data.regulasi || [])
      }
    } catch {
      setRegulasiList([])
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (regulasi: Regulasi) => {
    setDownloadingId(regulasi.id)
    
    try {
      // Open in new tab for preview/download
      window.open(`/api/regulasi/${regulasi.id}?download=true`, '_blank')
      toast.success('Download dimulai...')
      
      // Update local count optimistically
      setRegulasiList(prev => prev.map(r => 
        r.id === regulasi.id 
          ? { ...r, downloadCount: r.downloadCount + 1 }
          : r
      ))
    } catch {
      toast.error('Gagal mengunduh PDF')
    } finally {
      setTimeout(() => setDownloadingId(null), 1000)
    }
  }

  const filteredRegulasi = regulasiList.filter(r => {
    const matchSearch = !search || 
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(search.toLowerCase()))
    
    const matchCategory = categoryFilter === 'SEMUA' || r.category === categoryFilter
    
    return matchSearch && matchCategory
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-700 to-green-800 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <FileText className="h-5 w-5" />
              <span className="text-sm font-medium">Pusat Dokumen Regulasi</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Regulasi & Dokumen Resmi
            </h1>
            <p className="text-lg text-green-100 max-w-2xl mx-auto">
              Akses dan unduh dokumen regulasi resmi terkait ketenagalistrikan, 
              lingkungan energi, dan kebijakan sektor kelistrikan Indonesia.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        {/* Search & Filter */}
        <Card className="border-0 shadow-md mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Cari dokumen regulasi..."
                  className="pl-11 h-12 text-base"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-[200px] h-12">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  {REGULASI_CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>
                      {c === 'SEMUA' ? 'Semua Kategori' : c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="border shadow-sm">
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    <div className="flex justify-between items-center pt-4">
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                      <div className="h-8 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredRegulasi.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16">
            <FileText className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Belum Ada Regulasi</h3>
            <p className="text-gray-500">
              {search || categoryFilter !== 'SEMUA' 
                ? 'Tidak ditemukan regulasi yang sesuai filter.'
                : 'Dokumen regulasi akan segera tersedia.'}
            </p>
          </div>
        ) : (
          /* Regulasi Grid */
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Menampilkan {filteredRegulasi.length} dokumen regulasi
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRegulasi.map((regulasi, index) => (
                <motion.div
                  key={regulasi.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="group border shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                    <CardContent className="p-6 flex-1 flex flex-col">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 shrink-0">
                          {regulasi.category}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(regulasi.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="font-semibold text-lg line-clamp-2 mb-2 group-hover:text-green-700 transition-colors">
                        {regulasi.title}
                      </h3>

                      {/* Description */}
                      {regulasi.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                          {regulasi.description}
                        </p>
                      )}

                      {/* File Info */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4 py-2 px-3 bg-gray-50 rounded-lg">
                        <FileText className="h-4 w-4 text-red-500" />
                        <span className="truncate">{regulasi.fileName || 'PDF Document'}</span>
                        {regulasi.fileSize && (
                          <span className="ml-auto shrink-0">
                            ({formatFileSize(regulasi.fileSize)})
                          </span>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t mt-auto">
                        <span className="text-xs text-muted-foreground">
                          {regulasi.downloadCount}x diunduh
                        </span>
                        
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleDownload(regulasi)}
                          disabled={downloadingId === regulasi.id}
                        >
                          {downloadingId === regulasi.id ? (
                            <>
                              <span className="animate-spin mr-1">⏳</span>
                              Loading...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-1.5" />
                              Unduh PDF
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Info Section */}
      <section className="bg-gray-50 py-12 px-4 mt-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Tentang Pusat Regulasi</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Pusat Regulasi ALLIN menyediakan akses terhadap dokumen-dokumen resmi yang berkaitan dengan 
            industri ketenagalistrikan di Indonesia. Semua dokumen telah diverifikasi dan dapat diunduh 
            secara gratis oleh seluruh komunitas.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Dokumen Terverifikasi</h3>
              <p className="text-sm text-muted-foreground">Semua dokumen berasal dari sumber resmi dan terverifikasi</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Download className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Gratis & Mudah</h3>
              <p className="text-sm text-muted-foreground">Unduh langsung tanpa registrasi atau biaya apapun</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Selalu Update</h3>
              <p className="text-sm text-muted-foreground">Dokumen baru ditambahkan secara berkala</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
