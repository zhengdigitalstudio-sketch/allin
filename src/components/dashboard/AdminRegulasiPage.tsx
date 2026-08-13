'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, Upload, Plus, Search, Filter, Download, Trash2, Edit3,
  Eye, EyeOff, Globe, Lock, X, Check, AlertCircle, ExternalLink,
  FileDown, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

// Types
interface Regulasi {
  id: string;
  title: string;
  description: string | null;
  category: string;
  fileName: string;
  fileUrl: string; // Cloudinary URL
  fileSize: number;
  mimeType: string;
  publicId: string; // Cloudinary public_id
  status: string;
  isForMemberOnly: boolean;
  downloadCount: number;
  authorId: string;
  author: { id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

// Categories
const CATEGORIES = ['Umum', 'Lingkungan', 'K3', 'Teknologi', 'Hukum', 'Keuangan', 'SDM'];

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Format date
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminRegulasiPage() {
  // State
  const [regulasiList, setRegulasiList] = useState<Regulasi[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingRegulasi, setEditingRegulasi] = useState<Regulasi | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Umum',
    isForMemberOnly: false,
    status: 'PUBLISHED',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Fetch regulasi list
  const fetchRegulasi = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (categoryFilter !== 'Semua') params.append('category', categoryFilter);
      
      const response = await fetch(`/api/regulasi?${params.toString()}`);
      if (!response.ok) throw new Error('Gagal mengambil data');
      
      const data = await response.json();
      setRegulasiList(data);
    } catch (error) {
      console.error('Error fetching regulasi:', error);
      toast.error('Gagal memuat data regulasi');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, categoryFilter]);

  // Initial fetch
  useEffect(() => {
    fetchRegulasi();
  }, [fetchRegulasi]);

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'Umum',
      isForMemberOnly: false,
      status: 'PUBLISHED',
    });
    setSelectedFile(null);
    setEditingRegulasi(null);
  };

  // Handle create/edit dialog open
  const handleOpenDialog = (regulasi?: Regulasi) => {
    if (regulasi) {
      setEditingRegulasi(regulasi);
      setFormData({
        title: regulasi.title,
        description: regulasi.description || '',
        category: regulasi.category,
        isForMemberOnly: regulasi.isForMemberOnly,
        status: regulasi.status,
      });
      setSelectedFile(null);
    } else {
      resetForm();
    }
    setShowCreateDialog(true);
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      toast.error('Hanya file PDF yang diterima');
      return;
    }

    // Validate file size (10MB max for Cloudinary free tier)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`Ukuran file terlalu besar. Maksimal 10MB (file Anda: ${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      return;
    }

    setSelectedFile(file);
    toast.success(`File dipilih: ${file.name} (${formatFileSize(file.size)})`);
  };

  // Handle submit (create/update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      toast.error('Title wajib diisi');
      return;
    }

    // For new regulasi, file is required
    if (!editingRegulasi && !selectedFile) {
      toast.error('File PDF wajib diunggah');
      return;
    }

    setSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('isForMemberOnly', String(formData.isForMemberOnly));
      formDataToSend.append('status', formData.status);
      
      if (selectedFile) {
        formDataToSend.append('file', selectedFile);
      }

      const url = editingRegulasi ? `/api/regulasi/${editingRegulasi.id}` : '/api/regulasi';
      const method = editingRegulasi ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: formDataToSend,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal menyimpan regulasi');
      }

      toast.success(editingRegulasi ? 'Regulasi berhasil diperbarui' : 'Regulasi berhasil dibuat');
      setShowCreateDialog(false);
      resetForm();
      fetchRegulasi();
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(error.message || 'Gagal menyimpan regulasi');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (regulasi: Regulasi) => {
    if (!confirm(`Yakin ingin menghapus "${regulasi.title}"? File juga akan dihapus dari storage.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/regulasi/${regulasi.id}`, { method: 'DELETE' });
      
      if (!response.ok) throw new Error('Gagal menghapus');
      
      toast.success('Regulasi berhasil dihapus');
      fetchRegulasi();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Gagal menghapus regulasi');
    }
  };

  // Handle download
  const handleDownload = async (regulasi: Regulasi) => {
    try {
      // Increment download count and get URL
      const response = await fetch(`/api/regulasi/${regulasi.id}?download=true`);
      const data = await response.json();

      if (data.url) {
        // Open Cloudinary URL in new tab for download
        window.open(data.url, '_blank');
        toast.success(`Mengunduh ${regulasi.fileName}`);
        
        // Update local count
        setRegulasiList(prev => prev.map(r => 
          r.id === regulasi.id 
            ? { ...r, downloadCount: r.downloadCount + 1 }
            : r
        ));
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Gagal mengunduh file');
    }
  };

  // Toggle visibility
  const toggleVisibility = async (regulasi: Regulasi) => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', regulasi.title);
      formDataToSend.append('description', regulasi.description || '');
      formDataToSend.append('category', regulasi.category);
      formDataToSend.append('isForMemberOnly', String(!regulasi.isForMemberOnly));
      formDataToSend.append('status', regulasi.status);

      const response = await fetch(`/api/regulasi/${regulasi.id}`, {
        method: 'PUT',
        body: formDataToSend,
      });

      if (!response.ok) throw new Error('Gagal mengubah visibilitas');

      toast.success(`Visibilitas diubah menjadi ${!regulasi.isForMemberOnly ? 'Member Only' : 'Publik'}`);
      fetchRegulasi();
    } catch (error) {
      console.error('Toggle error:', error);
      toast.error('Gagal mengubah visibilitas');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-blue-600" />
            Kelola Regulasi
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload dan kelola dokumen regulasi (PDF via Cloudinary)
          </p>
        </div>
        <button
          onClick={() => handleOpenDialog()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Tambah Regulasi
        </button>
      </div>

      {/* Info Banner - Cloudinary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="bg-white p-2 rounded-lg shadow-sm">
            <Upload className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 text-sm">Cloudinary Storage Active</h3>
            <p className="text-xs text-blue-700 mt-1">
              File PDF disimpan di Cloudinary CDN • Maksimal 10MB per file • Download cepat dari global CDN
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Active</span>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari judul, deskripsi, atau nama file..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="Semua">Semua Kategori</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <button
          onClick={fetchRegulasi}
          className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading && regulasiList.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : regulasiList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-medium">Belum ada regulasi</p>
            <p className="text-sm mt-1">Klik "Tambah Regulasi" untuk membuat yang pertama</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Judul / File
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                    Kategori
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">
                    Ukuran
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">
                    Visibilitas
                  </th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">
                    Download
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {regulasi.map((regulasi) => (
                  <tr key={regulasi.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-red-100 p-2 rounded-lg mt-0.5">
                          <FileText className="w-4 h-4 text-red-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 truncate">{regulasi.title}</p>
                          <p className="text-sm text-gray-500 truncate">{regulasi.fileName}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            oleh {regulasi.author.name} · {formatDate(regulasi.createdAt)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                        {regulasi.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="text-sm text-gray-600">{formatFileSize(regulasi.fileSize)}</span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <button
                        onClick={() => toggleVisibility(regulasi)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                          regulasi.isForMemberOnly
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                        title={regulasi.isForMemberOnly ? 'Ubah ke Publik' : 'Ubah ke Member Only'}
                      >
                        {regulasi.isForMemberOnly ? (
                          <>
                            <Lock className="w-3 h-3" /> Member Only
                          </>
                        ) : (
                          <>
                            <Globe className="w-3 h-3" /> Publik
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center hidden sm:table-cell">
                      <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                        <Download className="w-4 h-4" />
                        {regulasi.downloadCount}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownload(regulasi)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Download"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDialog(regulasi)}
                          className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(regulasi)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Footer count */}
        {!loading && regulasiList.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Menampilkan <strong>{regulasiList.length}</strong> regulasi
            </p>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => {
                setShowCreateDialog(false);
                resetForm();
              }}
            />
            
            {/* Dialog */}
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-auto overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">
                    {editingRegulasi ? 'Edit Regulasi' : 'Tambah Regulasi Baru'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowCreateDialog(false);
                      resetForm();
                    }}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Judul Regulasi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Masukkan judul regulasi..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Deskripsi
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Deskripsi singkat tentang regulasi ini..."
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Category & Status Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Kategori
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                    >
                      <option value="PUBLISHED">Diterbitkan</option>
                      <option value="DRAFT">Draft</option>
                    </select>
                  </div>
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    File PDF {!editingRegulasi && <span className="text-red-500">*</span>}
                    {editingRegulasi && <span className="text-gray-400 font-normal">(kosongkan jika tidak diubah)</span>}
                  </label>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      id="pdf-upload"
                    />
                    
                    {!selectedFile ? (
                      <label htmlFor="pdf-upload" className="cursor-pointer block text-center">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          Klik untuk upload PDF
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Maksimal 10MB (Cloudinary)
                        </p>
                      </label>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="bg-red-100 p-2 rounded-lg">
                          <FileText className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(selectedFile.size)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedFile(null)}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Current file info when editing */}
                  {editingRegulasi && !selectedFile && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                      <FileDown className="w-4 h-4" />
                      <span>File saat ini: {editingRegulasi.fileName} ({formatFileSize(editingRegulasi.fileSize)})</span>
                    </div>
                  )}
                </div>

                {/* Visibility Toggle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Visibilitas
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isForMemberOnly: false })}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                        !formData.isForMemberOnly
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <Globe className="w-5 h-5" />
                      <div className="text-left">
                        <p className="font-medium text-sm">Publik</p>
                        <p className="text-xs opacity-70">Bisa diakses semua orang</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isForMemberOnly: true })}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                        formData.isForMemberOnly
                          ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <Lock className="w-5 h-5" />
                      <div className="text-left">
                        <p className="font-medium text-sm">Member Only</p>
                        <p className="text-xs opacity-70">Hanya untuk member</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateDialog(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Menyimpan...
                      </>
                    ) : editingRegulasi ? (
                      <>
                        <Check className="w-4 h-4" />
                        Perbarui
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload ke Cloudinary
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
