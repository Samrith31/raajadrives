'use client';

import { useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import { ReleaseType } from '@/app/data/release';

interface ReleasePayload {
  title: string;
  artist: string;
  slug: string;
  year: number;
  type: string;
  quality: string;
  download_url: string;
  cover_url: string;
  is_single: boolean;
  rating_sum: number;
  rating_count: number;
}

export default function UploadPage() {
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    artist: 'Ilaiyaraaja',
    year: new Date().getFullYear().toString(),
    slug: '',
    type: 'hires-flac' as ReleaseType | 'single',
    quality: '',
    downloadUrl: '',
    isSingle: false,
  });
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let coverUrl = '';

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${formData.slug}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('covers')
          .upload(fileName, file);

        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage
          .from('covers')
          .getPublicUrl(fileName);
          
        coverUrl = publicUrlData.publicUrl;
      }

      // --- THE FIX: FORCING THE BOOLEAN ---
      // This ensures if either the toggle is true OR the type is 'single', 
      // the database always receives TRUE for is_single.
      const finalIsSingle = formData.isSingle || formData.type === 'single';

      const payload: ReleasePayload = {
        title: formData.title,
        artist: formData.artist,
        slug: formData.slug,
        year: parseInt(formData.year, 10),
        type: formData.type,
        quality: formData.quality,
        download_url: formData.downloadUrl,
        cover_url: coverUrl,
        is_single: finalIsSingle,
        rating_sum: 0,
        rating_count: 0
      };

      const { error: dbError } = await supabase
        .from('releases')
        .insert([payload]);

      if (dbError) throw dbError;

      alert(`${finalIsSingle ? 'Single' : 'Album'} Uploaded Successfully!`);
      
      setFormData({ ...formData, title: '', slug: '', quality: '', downloadUrl: '' });
      setFile(null);
      setPreview(null);
      
    } catch (error: unknown) {
      let errorMessage = 'An unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      alert(`Upload failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 md:p-20 flex justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-xl space-y-6 bg-neutral-900/50 p-8 rounded-2xl border border-white/5 backdrop-blur-md">
        <header className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-black uppercase tracking-tighter">New Entry</h1>
          <button 
            type="button"
            onClick={() => setFormData({
              ...formData, 
              isSingle: !formData.isSingle, 
              type: !formData.isSingle ? 'single' : 'hires-flac'
            })}
            className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all
              ${formData.isSingle ? 'bg-amber-500 text-black' : 'bg-neutral-800 text-neutral-400'}`}
          >
            {formData.isSingle ? 'Single Release' : 'Full Album'}
          </button>
        </header>

        <div className="space-y-4">
          <input 
            type="text" placeholder="Entry Title" required
            value={formData.title}
            className="w-full p-3 bg-black border border-white/10 rounded-xl focus:border-red-600 outline-none transition-colors"
            onChange={(e) => {
              const val = e.target.value;
              const generatedSlug = val.toLowerCase().trim()
                .replace(/[^\w\s-]/g, '')
                .replace(/[\s_-]+/g, '-')
                .replace(/^-+|-+$/g, '');
              setFormData({...formData, title: val, slug: generatedSlug});
            }}
          />

          <input 
            type="text" placeholder="Slug (auto-generated)" required
            value={formData.slug}
            className="w-full p-3 bg-black border border-white/10 rounded-xl text-neutral-500 font-mono text-xs"
            onChange={(e) => setFormData({...formData, slug: e.target.value})}
          />

          <div className="flex gap-4">
            <input 
              type="number" placeholder="Year" required
              value={formData.year}
              className="w-1/2 p-3 bg-black border border-white/10 rounded-xl focus:border-red-600 outline-none"
              onChange={(e) => setFormData({...formData, year: e.target.value})}
            />
            <select 
              value={formData.type}
              className="w-1/2 p-3 bg-black border border-white/10 rounded-xl focus:border-red-600 outline-none"
              onChange={(e) => {
                const newType = e.target.value;
                setFormData({
                  ...formData, 
                  type: newType as ReleaseType | 'single',
                  isSingle: newType === 'single' // Auto-set boolean if type is changed
                });
              }}
            >
              <option value="hires-flac">Hi-Res FLAC</option>
              <option value="cd-flac">CD FLAC</option>
              <option value="cdrip">CD Rip</option>
              <option value="lprip">LP Rip</option>
              <option value="single">Single Song</option>
            </select>
          </div>

          <input 
            type="text" placeholder="Technical Quality" 
            value={formData.quality}
            className="w-full p-3 bg-black border border-white/10 rounded-xl focus:border-red-600 outline-none"
            onChange={(e) => setFormData({...formData, quality: e.target.value})}
          />

          <input 
            type="url" placeholder="Direct Download URL" required
            value={formData.downloadUrl}
            className="w-full p-3 bg-black border border-white/10 rounded-xl focus:border-red-600 outline-none"
            onChange={(e) => setFormData({...formData, downloadUrl: e.target.value})}
          />

          <div className="relative group overflow-hidden rounded-xl border-2 border-dashed border-white/10 hover:border-red-600/50 transition-colors">
            <input 
              type="file" accept="image/*" id="cover-upload" className="hidden" 
              onChange={handleFileChange}
            />
            <label htmlFor="cover-upload" className="cursor-pointer flex flex-col items-center justify-center py-8">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Preview" className="h-32 w-32 object-cover rounded shadow-2xl mb-2" />
              ) : (
                <div className="text-center">
                  <p className="text-sm text-neutral-400">Drag artwork here or click</p>
                  <p className="text-[10px] text-neutral-600 uppercase mt-1 italic tracking-tighter">Square (500x500)</p>
                </div>
              )}
            </label>
          </div>
        </div>

        <button 
          disabled={loading}
          className={`w-full py-4 rounded-xl font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95
            ${loading ? 'bg-neutral-800' : 'bg-red-600 hover:bg-red-500 shadow-red-900/20'}`}
        >
          {loading ? 'Processing Signal...' : `Upload ${formData.isSingle ? 'Single' : 'Album'}`}
        </button>
      </form>
    </div>
  );
}