'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

interface LogEntry { id: string; userName: string; action: string; description: string | null; ipAddress: string | null; createdAt: string }

export function AdminActivityPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/activity-log')
      if (res.ok) { const data = await res.json(); setLogs(Array.isArray(data) ? data : []) }
    } catch { setLogs([]) } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold">Activity Log</h2><p className="text-muted-foreground text-sm mt-1">Riwayat aktivitas pengguna sistem</p></div>
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div> :
          logs.length === 0 ? <div className="p-12 text-center"><Activity className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" /><p className="text-muted-foreground">Belum ada aktivitas tercatat.</p></div> :
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs">Waktu</TableHead><TableHead className="text-xs">Pengguna</TableHead><TableHead className="text-xs">Aksi</TableHead><TableHead className="text-xs hidden md:table-cell">Deskripsi</TableHead><TableHead className="text-xs hidden lg:table-cell">IP Address</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {logs.map((log, i) => (
                <motion.tr key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b last:border-0 hover:bg-muted/50">
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap py-3">{format(new Date(log.createdAt), 'dd MMM yyyy, HH:mm', { locale: localeId })}</TableCell>
                  <TableCell className="text-xs font-medium py-3">{log.userName || '-'}</TableCell>
                  <TableCell className="py-3"><Badge variant="secondary" className="text-[10px]">{log.action}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden md:table-cell max-w-[250px] truncate py-3">{log.description || '-'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden lg:table-cell py-3">{log.ipAddress || '-'}</TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>}
        </CardContent>
      </Card>
    </div>
  )
}