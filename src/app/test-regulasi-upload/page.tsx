'use client';

import React, { useState, useEffect } from 'react';

/**
 * 🧪 TEST PAGE - Regulasi Upload Test
 * 
 * Halaman ini 100% TERPISAH dari AdminRegulasiPage
 * Untuk testing apakah upload Cloudinary bekerja
 */

export default function TestRegulasiUpload() {
  const [status, setStatus] = useState<string>('⏳ Menunggu...');
  const [result, setResult] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  useEffect(() => {
    setStatus('✅ Halaman Test Siap!');
    console.log('🧪 TEST PAGE LOADED - This is a completely separate page!');
  }, []);

  const handleTestUpload = async () => {
    if (!selectedFile) {
      alert('Pilih file dulu!');
      return;
    }

    try {
      setStatus('🔄 Memulai upload test...');
      setResult('');

      // ============================================
      // MINIMAL UNSIGNED UPLOAD - NOTHING ELSE!
      // ============================================
      const CLOUD_NAME = 'czpvpb9j';
      const UPLOAD_PRESET = 'regulasi_pdf_upload';
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('upload_preset', UPLOAD_PRESET);

      setStatus(`📤 Uploading ${selectedFile.name}...`);
      
      console.log('📤 TEST: Sending to Cloudinary:');
      console.log('   - URL:', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`);
      console.log('   - Fields:', [...formData.entries()].map(([k, v]) => `${k}: ${v instanceof File ? v.name : v}`));
      
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();
      
      console.log('📥 TEST Response:', response.status, data);

      if (response.ok) {
        setStatus('✅✅✅ UPLOAD BERHASIL! ✅✅✅');
        setResult(JSON.stringify(data, null, 2));
        alert('🎉 UPLOAD SUCCESS!\n\nURL: ' + data.secure_url + '\n\nPublic ID: ' + data.public_id);
      } else {
        setStatus('❌ UPLOAD GAGAL');
        setResult(`Error ${response.status}:\n${JSON.stringify(data, null, 2)}`);
        alert('❌ Upload Failed:\n' + data.error?.message || JSON.stringify(data));
      }

    } catch (error: any) {
      console.error('❌ TEST Error:', error);
      setStatus('❌ ERROR: ' + error.message);
      setResult(error.message);
      alert('❌ Error: ' + error.message);
    }
  };

  return (
    <div style={{ 
      padding: '40px', 
      maxWidth: '800px', 
      margin: '0 auto',
      fontFamily: 'monospace',
      background: '#f0f0f0',
      minHeight: '100vh'
    }}>
      {/* HEADER */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white', 
        padding: '30px', 
        borderRadius: '15px',
        marginBottom: '30px',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '28px' }}>🧪 REGULASI UPLOAD TEST</h1>
        <p style={{ margin: '10px 0 0 0', opacity: 0.9 }}>
          Halaman 100% Terpisah - Test Cloudinary Upload
        </p>
        <div style={{
          background: 'rgba(255,255,255,0.2)',
          padding: '10px',
          borderRadius: '8px',
          marginTop: '15px',
          fontSize: '14px'
        }}>
          Status: <strong>{status}</strong>
        </div>
      </div>

      {/* UPLOAD FORM */}
      <div style={{
        background: 'white',
        padding: '25px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h2>📁 Step 1: Pilih File PDF</h2>
        
        <input
          type="file"
          accept=".pdf,application/pdf"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setSelectedFile(file);
              setStatus(`📄 File dipilih: ${file.name} (${(file.size/1024/1024).toFixed(2)}MB)`);
            }
          }}
          style={{
            width: '100%',
            padding: '15px',
            border: '2px dashed #667eea',
            borderRadius: '8px',
            marginBottom: '15px',
            cursor: 'pointer'
          }}
        />

        {selectedFile && (
          <div style={{
            background: '#e8f5e9',
            padding: '10px',
            borderRadius: '6px',
            marginBottom: '15px'
          }}>
            ✅ File: <strong>{selectedFile.name}</strong><br/>
            Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
          </div>
        )}

        <h2>☁️ Step 2: Test Upload</h2>
        
        <button
          onClick={handleTestUpload}
          disabled={!selectedFile}
          style={{
            width: '100%',
            padding: '20px',
            fontSize: '18px',
            fontWeight: 'bold',
            background: selectedFile ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: selectedFile ? 'pointer' : 'not-allowed',
            transition: 'transform 0.2s'
          }}
        >
          🚀 TEST UPLOAD KE CLOUDINARY
        </button>

        <div style={{
          marginTop: '15px',
          padding: '15px',
          background: '#fff3cd',
          borderRadius: '6px',
          fontSize: '13px'
        }}>
          <strong>📋 Yang akan dikirim:</strong><br/>
          • file: (PDF yang dipilih)<br/>
          • upload_preset: <code>regulasi_pdf_upload</code><br/><br/>
          <strong>❌ TIDAK dikirim:</strong><br/>
          • signature<br/>
          • timestamp<br/>
          • folder<br/>
          • public_id<br/>
          • api_key
        </div>
      </div>

      {/* RESULT */}
      {result && (
        <div style={{
          background: status.includes('BERHASIL') ? '#d4edda' : '#f8d7da',
          padding: '20px',
          borderRadius: '12px',
          overflow: 'auto'
        }}>
          <h2>{status.includes('BERHASIL') ? '✅ RESULT:' : '❌ ERROR:'}</h2>
          <pre style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            fontSize: '12px',
            margin: '10px 0 0 0'
          }}>
            {result}
          </pre>
        </div>
      )}

      {/* DEBUG INFO */}
      <div style={{
        marginTop: '30px',
        padding: '20px',
        background: '#e3f2fd',
        borderRadius: '12px',
        fontSize: '13px'
      }}>
        <h3>🔍 Debug Info:</h3>
        <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px' }}>
          <li>Cloud Name: <code>czpvpb9j</code></li>
          <li>Upload Preset: <code>regulasi_pdf_upload</code></li>
          <li>Mode: <strong>UNSIGNED</strong></li>
          <li>This page is NOT connected to AdminRegulasiPage</li>
          <li>No React Hydration issues possible here</li>
        </ul>
      </div>
    </div>
  );
}
