'use client';

import { useState } from 'react';
import { supabase } from '@/app/lib/supabase';

export default function UploadPage() {
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    artist: 'Ilaiyaraaja',
    year: '',
    slug: '',
    type: 'hires-flac',
    quality: '',
    downloadUrl: '',
  });
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let coverUrl = '';

      // 1. Upload Image if exists
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${formData.slug}-${Date.now()}.${fileExt}`;
        const { data, error } = await supabase.storage
          .from('covers')
          .upload(fileName, file);

        if (error) throw error;
        
        // Get the Public URL
        const { data: publicUrlData } = supabase.storage
          .from('covers')
          .getPublicUrl(fileName);
          
        coverUrl = publicUrlData.publicUrl;
      }

      // 2. Insert Data into Database
      const { error: dbError } = await supabase
        .from('releases')
        .insert([{
          title: formData.title,
          artist: formData.artist,
          slug: formData.slug,
          year: parseInt(formData.year),
          type: formData.type,
          quality: formData.quality,
          download_url: formData.downloadUrl,
          cover_url: coverUrl
        }]);

      if (dbError) throw dbError;

      alert('Album Uploaded Successfully!');
      // Reset form...
      
    } catch (error) {
      console.error(error);
      alert('Error uploading album');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-10 flex justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold mb-6">Upload New Album</h1>

        <input 
          type="text" placeholder="Title (e.g. Thalapathi)" required
          className="w-full p-2 bg-neutral-900 border border-neutral-800 rounded"
          onChange={(e) => {
            setFormData({...formData, title: e.target.value});
            // Auto-generate slug
            setFormData(prev => ({...prev, slug: e.target.value.toLowerCase().replace(/ /g, '-')}));
          }}
        />

        <input 
          type="text" placeholder="Slug (thalapathi-1991)" required
          value={formData.slug}
          className="w-full p-2 bg-neutral-900 border border-neutral-800 rounded"
          onChange={(e) => setFormData({...formData, slug: e.target.value})}
        />

        <div className="flex gap-4">
          <input 
            type="number" placeholder="Year" required
            className="w-1/2 p-2 bg-neutral-900 border border-neutral-800 rounded"
            onChange={(e) => setFormData({...formData, year: e.target.value})}
          />
          <select 
            className="w-1/2 p-2 bg-neutral-900 border border-neutral-800 rounded"
            onChange={(e) => setFormData({...formData, type: e.target.value})}
          >
            <option value="hires-flac">Hi-Res FLAC</option>
            <option value="cd-flac">CD FLAC</option>
            <option value="cdrip">CD Rip</option>
            <option value="lprip">LP Rip</option>
          </select>
        </div>

        <input 
          type="text" placeholder="Quality (e.g. 24bit / 96kHz)" 
          className="w-full p-2 bg-neutral-900 border border-neutral-800 rounded"
          onChange={(e) => setFormData({...formData, quality: e.target.value})}
        />

        <input 
          type="url" placeholder="Download Link (Drive/Mega)" required
          className="w-full p-2 bg-neutral-900 border border-neutral-800 rounded"
          onChange={(e) => setFormData({...formData, downloadUrl: e.target.value})}
        />

        <div className="border border-dashed border-neutral-700 p-4 rounded text-center">
          <label className="cursor-pointer">
            <span className="text-sm text-neutral-400">Upload Cover Image</span>
            <input 
              type="file" accept="image/*" className="hidden" 
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
            />
          </label>
          {file && <p className="text-green-500 text-xs mt-2">{file.name}</p>}
        </div>

        <button 
          disabled={loading}
          className="w-full bg-red-600 py-3 rounded font-bold hover:bg-red-500 transition disabled:opacity-50"
        >
          {loading ? 'Uploading...' : 'Upload Album'}
        </button>
      </form>
    </div>
  );
}