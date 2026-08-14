'use client';

import { useState } from 'react';
import { Upload, CheckCircle, XCircle } from 'lucide-react';

// ============================================
// 🧪 CLOUDINARY DIRECT TEST - No Server, No Signature
// ============================================
// This component tests UNSIGNED upload directly to Cloudinary
// Using ONLY: upload_preset + file (nothing else!)

export default function CloudinaryTest() {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [details, setDetails] = useState('');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus('uploading');
    setMessage('🔄 Testing direct upload...');
    setDetails('');

    try {
      // ===========================================
      // 🆕 PURE UNSIGNED UPLOAD - Minimal Fields!
      // ===========================================
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'regulasi_pdf_upload'); // ONLY THIS!
      
      // Log exactly what we're sending
      console.log('📤 [TEST] Sending FormData with fields:');
      for (const [key, value] of formData.entries()) {
        console.log(`   ${key}: ${value instanceof File ? `[File: ${value.name}]` : value}`);
      }

      setStatus('uploading');
      setMessage('⏳ Uploading to Cloudinary...');
      
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/czpvpb9j/raw/upload?t=${Date.now()}`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const result = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('✅ SUCCESS! File uploaded!');
        setDetails(`URL: ${result.secure_url?.substring(0, 50)}...`);
        console.log('✅ [TEST] SUCCESS:', result);
      } else {
        setStatus('error');
        setMessage(`❌ Error ${response.status}`);
        setDetails(result.error?.message || JSON.stringify(result));
        console.error('❌ [TEST] ERROR:', result);
      }

    } catch (err: any) {
      setStatus('error');
      setMessage('❌ Network Error');
      setDetails(err.message);
      console.error('❌ [TEST] EXCEPTION:', err);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto border-2 border-dashed rounded-lg">
      <h2 className="text-xl font-bold mb-4">🧪 Cloudinary Direct Test</h2>
      <p className="text-sm text-gray-500 mb-4">
        Test upload TANPA signature, TANPA api_key, TANPA timestamp.<br/>
        Hanya pakai <code className="bg-gray-100 px-1 rounded">upload_preset</code>
      </p>

      {/* Status */}
      <div className={`p-4 rounded mb-4 ${
        status === 'success' ? 'bg-green-100 text-green-800' :
        status === 'error' ? 'bg-red-100 text-red-800' :
        status === 'uploading' ? 'bg-blue-100 text-blue-800' :
        'bg-gray-100'
      }`}>
        <div className="flex items-center gap-2">
          {status === 'success' && <CheckCircle size={20} />}
          {status === 'error' && <XCircle size={20} />}
          {status === 'uploading' && <Upload size={20} className="animate-spin" />}
          <span>{message}</span>
        </div>
        {details && (
          <pre className="mt-2 text-xs overflow-auto bg-black/10 p-2 rounded">
            {details}
          </pre>
        )}
      </div>

      {/* File Input */}
      <label className="block w-full p-4 border-2 rounded cursor-pointer hover:bg-gray-50 text-center">
        <input
          type="file"
          accept=".pdf"
          onChange={handleUpload}
          className="hidden"
          disabled={status === 'uploading'}
        />
        <Upload className="mx-auto mb-2" />
        <span>Choose PDF to test</span>
      </label>

      {/* Info */}
      <div className="mt-4 text-xs text-gray-400">
        <p><strong>Fields sent:</strong></p>
        <ul className="list-disc list-inside">
          <li>file (selected PDF)</li>
          <li>upload_preset = &quot;regulasi_pdf_upload&quot;</li>
        </ul>
        <p className="mt-2"><strong>NOT sent:</strong> api_key, signature, timestamp</p>
      </div>
    </div>
  );
}
