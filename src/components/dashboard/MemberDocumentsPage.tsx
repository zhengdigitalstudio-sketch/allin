'use client'

import { motion } from 'framer-motion'
import { FileText, Download, FileSpreadsheet, FileCheck, BookOpen } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

const documents = [
  { id: '1', title: 'SK Keanggotaan', desc: 'Surat Keputusan Keanggotaan ALLIN', size: '245 KB', downloads: 128, icon: FileCheck },
  { id: '2', title: 'AD/ART ALLIN', desc: 'Anggaran Dasar dan Anggaran Rumah Tangga', size: '1.2 MB', downloads: 256, icon: BookOpen },
  { id: '3', title: 'Laporan Tahunan 2024', desc: 'Laporan pertanggungjawaban tahunan', size: '3.4 MB', downloads: 89, icon: FileSpreadsheet },
  { id: '4', title: 'Pedoman Teknis', desc: 'Standar teknis ketenagalistrikan', size: '5.8 MB', downloads: 167, icon: FileText },
  { id: '5', title: 'Formulir Sertifikasi', desc: 'Formulir pendaftaran sertifikasi kompetensi', size: '180 KB', downloads: 94, icon: FileText },
]

export function MemberDocumentsPage() {
  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold">Dokumen</h2><p className="text-muted-foreground text-sm mt-1">Download dokumen dan publikasi ALLIN</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc, i) => (
          <motion.div key={doc.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="border-0 shadow-sm h-full hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="w-12 h-12 rounded-xl bg-allin-green/10 flex items-center justify-center mb-4"><doc.icon className="w-6 h-6 text-allin-green" /></div>
                <h3 className="font-semibold text-sm mb-1">{doc.title}</h3>
                <p className="text-xs text-muted-foreground mb-3">{doc.desc}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-muted-foreground">{doc.size}</span>
                    <span className="text-[10px] text-muted-foreground">{doc.downloads}x download</span>
                  </div>
                  <Button size="sm" variant="outline" className="h-7 text-xs border-allin-green text-allin-green hover:bg-allin-green/10" onClick={() => toast.info('Download dimulai')}>
                    <Download className="w-3 h-3 mr-1" />Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}