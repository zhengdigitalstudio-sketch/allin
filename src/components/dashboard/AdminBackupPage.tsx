'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Database, Download, FileSpreadsheet, HardDrive, Shield } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

const mockBackups = [
  { id: '1', date: '2024-12-20 14:30', size: '2.4 MB', status: 'Berhasil' },
  { id: '2', date: '2024-12-15 09:00', size: '2.3 MB', status: 'Berhasil' },
  { id: '3', date: '2024-12-10 16:45', size: '2.2 MB', status: 'Berhasil' },
]

export function AdminBackupPage() {
  const [backing, setBacking] = useState(false)

  const handleBackup = async () => {
    setBacking(true)
    await new Promise(r => setTimeout(r, 2000))
    setBacking(false)
    toast.success('Backup database berhasil dibuat')
  }

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold">Backup Database</h2><p className="text-muted-foreground text-sm mt-1">Kelola backup dan export data website ALLIN</p></div>

      <div className="grid md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><HardDrive className="w-5 h-5 text-allin-green" />Informasi Database</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Engine</span><span className="font-medium">SQLite</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Lokasi</span><span className="font-medium text-xs">/db/custom.db</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Estimasi Ukuran</span><span className="font-medium">~2.4 MB</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Tabel</span><span className="font-medium">12</span></div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="w-5 h-5 text-allin-green" />Aksi</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleBackup} disabled={backing} className="w-full bg-allin-green hover:bg-allin-green-dark text-white">
                <Database className="w-4 h-4 mr-2" />{backing ? 'Membackup...' : 'Backup Sekarang'}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => toast.info('Fitur export data akan segera tersedia')}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />Export Data Excel
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Riwayat Backup</CardTitle></CardHeader>
          <CardContent>
            {mockBackups.map((b, i) => (
              <div key={b.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-allin-green/10 flex items-center justify-center"><Database className="w-4 h-4 text-allin-green" /></div>
                  <div><p className="text-sm font-medium">{b.date}</p><p className="text-xs text-muted-foreground">{b.size}</p></div></div>
                <div className="flex items-center gap-2"><Badge variant="secondary" className="text-[10px] text-green-700 bg-green-50">{b.status}</Badge>
                  <Button variant="ghost" size="sm" className="h-7"><Download className="w-3.5 h-3.5" /></Button></div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}