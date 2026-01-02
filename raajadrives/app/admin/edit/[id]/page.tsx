'use client';

import { useState, useEffect, use } from 'react';
import { supabase } from '@/app/lib/supabase';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default function EditPage({ params }: EditPageProps) {
  const { id } = use(params);
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // 1. Updated Form State with isSingle
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    year: '',
    slug: '',
    type: 'hires-flac',
    quality: '',
    downloadUrl: '',
    coverUrl: '',
    isSingle: false // Added this
  });
  
  const [newFile, setNewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // 2. Fetch Data including is_single flag
  useEffect(() => {
    const fetchAlbum = async () => {
      const { data, error } = await supabase
        .from('releases')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching album:', error);
        alert('Could not find entry.');
        router.push('/admin/edit');
        return;
      }

      if (data) {
        setFormData({
          title: data.title,
          artist: data.artist,
          year: data.year.toString(),
          slug: data.slug,
          type: data.type,
          quality: data.quality || '',
          downloadUrl: data.download_url,
          coverUrl: data.cover_url || '',
          isSingle: data.is_single || false // Load from DB
        });
      }
      setLoading(false);
    };

    fetchAlbum();
  }, [id, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // 3. Update Database with is_single boolean
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      let finalCoverUrl = formData.coverUrl;

      if (newFile) {
        const fileExt = newFile.name.split('.').pop();
        const fileName = `${formData.slug}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('covers')
          .upload(fileName, newFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('covers')
          .getPublicUrl(fileName);
          
        finalCoverUrl = publicUrlData.publicUrl;
      }

      const { error: dbError } = await supabase
        .from('releases')
        .update({
          title: formData.title,
          artist: formData.artist,
          slug: formData.slug,
          year: parseInt(formData.year),
          type: formData.type,
          quality: formData.quality,
          download_url: formData.downloadUrl,
          cover_url: finalCoverUrl,
          is_single: formData.isSingle // Update DB flag
        })
        .eq('id', id);

      if (dbError) throw dbError;

      alert('Archive updated successfully!');
      router.push('/admin/edit');
      router.refresh();
      
    } catch (error) {
      console.error(error);
      alert('Update failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('🛑 Permanently delete this entry?')) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('releases').delete().eq('id', id);
      if (error) throw error;
      router.push('/admin/edit');
      router.refresh();
    } catch (error) {
      alert('Error deleting');
      setDeleting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-mono uppercase tracking-widest animate-pulse">Accessing Archive...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 flex justify-center">
      <div className="w-full max-w-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 border-b border-neutral-900 pb-6">
          <div className="flex items-center gap-4">
             <h1 className="text-3xl font-black uppercase tracking-tighter">Edit Entry</h1>
             {/* 4. NEW: SINGLE TOGGLE BUTTON */}
             <button 
                type="button"
                onClick={() => setFormData({...formData, isSingle: !formData.isSingle, type: !formData.isSingle ? 'single' : 'hires-flac'})}
                className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all
                  ${formData.isSingle ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'bg-neutral-800 text-neutral-400'}`}
              >
                {formData.isSingle ? 'Single' : 'Album'}
              </button>
          </div>
          <Link href="/admin/edit" className="text-xs font-bold text-neutral-500 hover:text-white transition uppercase tracking-widest">
            ← Cancel
          </Link>
        </div>

        <form onSubmit={handleUpdate} className="space-y-8">
          
          {/* Section: Cover Art */}
          <div className={`p-6 rounded-2xl border transition-colors duration-500 bg-neutral-900/30
            ${formData.isSingle ? 'border-amber-500/10' : 'border-neutral-800'}
          `}>
            <div className="flex gap-6 items-center">
              <div className="relative w-32 h-32 shrink-0 rounded-xl overflow-hidden shadow-2xl border border-white/5">
                <Image 
                  src={previewUrl || formData.coverUrl || '/placeholder.jpg'} 
                  alt="Preview" 
                  fill 
                  unoptimized={true}
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-black uppercase tracking-widest text-neutral-500 mb-3">Update Artwork</label>
                <input 
                  type="file" accept="image/*" onChange={handleFileChange}
                  className="block w-full text-xs text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-white file:text-black cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Section: Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-neutral-600 uppercase mb-2 tracking-[0.2em]">Title</label>
              <input 
                type="text" required value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 text-white focus:border-red-600 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-neutral-600 uppercase mb-2 tracking-[0.2em]">Artist</label>
              <input 
                type="text" required value={formData.artist}
                onChange={(e) => setFormData({...formData, artist: e.target.value})}
                className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 text-white focus:border-red-600 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-neutral-600 uppercase mb-2 tracking-[0.2em]">Year</label>
              <input 
                type="number" required value={formData.year}
                onChange={(e) => setFormData({...formData, year: e.target.value})}
                className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 text-white focus:border-red-600 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-neutral-600 uppercase mb-2 tracking-[0.2em]">Format</label>
              <select 
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value, isSingle: e.target.value === 'single'})}
                className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 text-white focus:border-red-600 focus:outline-none transition"
              >
                <option value="hires-flac">Hi-Res FLAC</option>
                <option value="cd-flac">CD FLAC</option>
                <option value="cdrip">CD Rip</option>
                <option value="lprip">LP Rip</option>
                <option value="single">Single Song</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-neutral-600 uppercase mb-2 tracking-[0.2em]">Quality Badge</label>
              <input 
                type="text" placeholder="24bit / 48kHz" value={formData.quality}
                onChange={(e) => setFormData({...formData, quality: e.target.value})}
                className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 text-white focus:border-red-600 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Section: Technical Links */}
          <div className="space-y-6 bg-black border border-neutral-900 p-6 rounded-2xl shadow-inner">
            <div>
              <label className="block text-[10px] font-black text-neutral-600 uppercase mb-2 tracking-[0.2em]">URL Slug</label>
              <input 
                type="text" required value={formData.slug}
                onChange={(e) => setFormData({...formData, slug: e.target.value})}
                className="w-full bg-transparent border-b border-neutral-800 p-2 text-neutral-500 font-mono text-sm focus:border-red-600 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-neutral-600 uppercase mb-2 tracking-[0.2em]">Cloud Storage Link</label>
              <input 
                type="url" required value={formData.downloadUrl}
                onChange={(e) => setFormData({...formData, downloadUrl: e.target.value})}
                className="w-full bg-transparent border-b border-neutral-800 p-2 text-blue-500 font-mono text-sm focus:border-red-600 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-8">
            <button 
              type="submit" disabled={saving}
              className={`flex-1 py-5 rounded-full font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl
                ${saving ? 'bg-neutral-800 text-neutral-500' : 'bg-white text-black hover:bg-red-600 hover:text-white'}
              `}
            >
              {saving ? 'Processing...' : 'Commit Changes'}
            </button>
            
            <button 
              type="button" onClick={handleDelete} disabled={deleting}
              className="px-8 py-5 rounded-full font-black uppercase tracking-widest text-[10px] text-red-600 border border-red-900/20 hover:bg-red-950/20 transition disabled:opacity-50"
            >
              {deleting ? 'Removing...' : 'Delete'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}