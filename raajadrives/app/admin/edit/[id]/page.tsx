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
  // 1. Unwrap the params (Required for Next.js 15)
  const { id } = use(params);
  
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    year: '',
    slug: '',
    type: 'hires-flac',
    quality: '',
    downloadUrl: '',
    coverUrl: ''
  });
  
  // State for new image upload
  const [newFile, setNewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // 2. Fetch Existing Data on Load
  useEffect(() => {
    const fetchAlbum = async () => {
      const { data, error } = await supabase
        .from('releases')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching album:', error);
        alert('Could not find album. Returning to dashboard.');
        router.push('/admin');
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
          coverUrl: data.cover_url || ''
        });
      }
      setLoading(false);
    };

    fetchAlbum();
  }, [id, router]);

  // Handle Image Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // 3. Handle Save/Update
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      let finalCoverUrl = formData.coverUrl;

      // A. If a new file is selected, upload it first
      if (newFile) {
        const fileExt = newFile.name.split('.').pop();
        const fileName = `${formData.slug}-${Date.now()}.${fileExt}`;
        
        // Upload
        const { error: uploadError } = await supabase.storage
          .from('covers')
          .upload(fileName, newFile);

        if (uploadError) throw uploadError;

        // Get Public URL
        const { data: publicUrlData } = supabase.storage
          .from('covers')
          .getPublicUrl(fileName);
          
        finalCoverUrl = publicUrlData.publicUrl;
      }

      // B. Update Database
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
          cover_url: finalCoverUrl
        })
        .eq('id', id);

      if (dbError) throw dbError;

      alert('Album updated successfully!');
      router.push('/admin'); // Return to dashboard
      router.refresh();      // Refresh data to show changes
      
    } catch (error) {
      console.error(error);
      alert('Failed to update album. Check console for details.');
    } finally {
      setSaving(false);
    }
  };

  // 4. Handle Delete
  const handleDelete = async () => {
    if (!confirm('🛑 ARE YOU SURE?\n\nThis will permanently delete this album from the database.\nThis action cannot be undone.')) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('releases')
        .delete()
        .eq('id', id);

      if (error) throw error;

      router.push('/admin');
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Error deleting album');
      setDeleting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 flex justify-center">
      <div className="w-full max-w-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Edit Album</h1>
          <Link href="/admin/edit" className="text-sm text-neutral-400 hover:text-white transition">
            ← Back to List
          </Link>
        </div>

        <form onSubmit={handleUpdate} className="space-y-8">
          
          {/* Section: Cover Art */}
          <div className="bg-neutral-900/50 p-6 rounded-xl border border-neutral-800">
            <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-4">Cover Art</h2>
            <div className="flex gap-6 items-start">
              {/* Image Preview */}
              <div className="relative w-32 h-32 shrink-0 bg-neutral-800 rounded-lg overflow-hidden border border-neutral-700">
                <Image 
                  src={previewUrl || formData.coverUrl || '/placeholder.jpg'} 
                  alt="Preview" 
                  fill 
                  className="object-cover"
                />
              </div>
              
              {/* File Input */}
              <div className="flex-1">
                <label className="block text-white font-medium mb-2">Change Cover Image</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange}
                  className="block w-full text-sm text-neutral-400
                    file:mr-4 file:py-2.5 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-bold
                    file:bg-neutral-800 file:text-white
                    hover:file:bg-neutral-700 cursor-pointer"
                />
                <p className="text-xs text-neutral-500 mt-2">
                  Leave empty to keep the current cover.
                </p>
              </div>
            </div>
          </div>

          {/* Section: Album Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Album Title</label>
              <input 
                type="text" required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-red-600 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Artist</label>
              <input 
                type="text" required
                value={formData.artist}
                onChange={(e) => setFormData({...formData, artist: e.target.value})}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-red-600 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Year</label>
              <input 
                type="number" required
                value={formData.year}
                onChange={(e) => setFormData({...formData, year: e.target.value})}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-red-600 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Format Type</label>
              <select 
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-red-600 focus:outline-none transition"
              >
                <option value="hires-flac">Hi-Res FLAC</option>
                <option value="cd-flac">CD FLAC</option>
                <option value="cdrip">CD Rip</option>
                <option value="lprip">LP Rip</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Quality Badge</label>
              <input 
                type="text" 
                placeholder="e.g. 24bit / 96kHz"
                value={formData.quality}
                onChange={(e) => setFormData({...formData, quality: e.target.value})}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-red-600 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Section: Technical */}
          <div className="bg-neutral-900/30 p-6 rounded-xl border border-neutral-800/50">
             <div className="mb-4">
              <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">URL Slug</label>
              <input 
                type="text" required
                value={formData.slug}
                onChange={(e) => setFormData({...formData, slug: e.target.value})}
                className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-neutral-400 font-mono text-sm focus:ring-2 focus:ring-red-600 focus:outline-none transition"
              />
              <p className="text-[10px] text-neutral-600 mt-1">Warning: Changing this will break old links.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Download Link</label>
              <input 
                type="url" required
                value={formData.downloadUrl}
                onChange={(e) => setFormData({...formData, downloadUrl: e.target.value})}
                className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-blue-400 font-mono text-sm focus:ring-2 focus:ring-red-600 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 pt-4 border-t border-neutral-800">
            <button 
              type="submit"
              disabled={saving}
              className="flex-1 bg-white text-black py-4 rounded-full font-bold hover:bg-neutral-200 transition disabled:opacity-50"
            >
              {saving ? 'Saving Changes...' : 'Save Updates'}
            </button>
            
            <button 
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-6 py-4 rounded-full font-bold text-red-500 border border-red-900/30 hover:bg-red-950/30 transition disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}