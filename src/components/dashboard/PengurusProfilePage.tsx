'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { User, Mail, Building2, Briefcase, Phone, Lock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

export function PengurusProfilePage() {
  const { data: session } = useSession()
  const user = session?.user as any
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', position: user?.position || '', company: user?.company || '', bio: user?.bio || '' })
  const [pw, setPw] = useState({ current: '', newPw: '', confirm: '' })

  const handleSave = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 1000))
    setSaving(false)
    toast.success('Profil berhasil diperbarui')
  }

  const handlePwChange = () => {
    if (!pw.current || !pw.newPw || !pw.confirm) { toast.error('Semua field password wajib diisi'); return }
    if (pw.newPw !== pw.confirm) { toast.error('Password baru tidak cocok'); return }
    toast.success('Password berhasil diubah')
    setPw({ current: '', newPw: '', confirm: '' })
  }

  const initials = (user?.name || 'U').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold">Profil Saya</h2><p className="text-muted-foreground text-sm mt-1">Kelola informasi profil Anda</p></div>
      <div className="grid md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-0 shadow-sm text-center">
            <CardContent className="pt-8 pb-6">
              <div className="w-24 h-24 rounded-full gradient-green flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">{initials}</div>
              <h3 className="font-bold text-lg">{user?.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
              <p className="text-xs text-allin-green font-medium mt-2 bg-allin-green/10 inline-block px-3 py-1 rounded-full">{user?.role}</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="md:col-span-2 space-y-6">
          <Card className="border-0 shadow-sm"><CardHeader><CardTitle className="text-base">Informasi Pribadi</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Nama Lengkap</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
                <div><Label>Email</Label><Input value={user?.email || ''} disabled className="bg-muted" /></div>
                <div><Label>No. Telepon</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
                <div><Label>Jabatan</Label><Input value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))} /></div>
                <div><Label>Perusahaan</Label><Input value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} /></div>
              </div>
              <div><Label>Bio</Label><Textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} rows={3} /></div>
              <Button onClick={handleSave} disabled={saving} className="bg-allin-green hover:bg-allin-green-dark text-white">{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</Button>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm"><CardHeader><CardTitle className="text-base flex items-center gap-2"><Lock className="w-4 h-4" />Ubah Password</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Password Saat Ini</Label><Input type="password" value={pw.current} onChange={e => setP(p => ({ ...p, current: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Password Baru</Label><Input type="password" value={pw.newPw} onChange={e => setP(p => ({ ...p, newPw: e.target.value }))} /></div>
                <div><Label>Konfirmasi</Label><Input type="password" value={pw.confirm} onChange={e => setP(p => ({ ...p, confirm: e.target.value }))} /></div>
              </div>
              <Button variant="outline" onClick={handlePwChange}>Ubah Password</Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}