'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import { supabase } from '@/app/lib/supabase';
import { HiSpeakerphone, HiLink, HiShieldCheck, HiArrowRight, HiPhotograph, HiX } from 'react-icons/hi';
import Link from 'next/link';

/* ---------------- TYPES ---------------- */

interface AnnouncementFormData {
  text: string;
  link: string;
  is_active: boolean;
}

interface AnnouncementPayload {
  text: string;
  link: string;
  is_active: boolean;
  image_url: string;
}

/* ---------------- PAGE ---------------- */

export default function AnnouncementAdminPage() {
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState<AnnouncementFormData>({
    text: '',
    link: '/announcements',
    is_active: true,
  });

  // Media State
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const clearImage = () => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.text.trim()) return;
    
    setLoading(true);

    try {
      let uploadedImageUrl = '';

      // 1. Upload Image to the dedicated 'announcements' bucket
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `signal-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('announcements')
          .upload(fileName, file);

        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage
          .from('announcements')
          .getPublicUrl(fileName);
          
        uploadedImageUrl = publicUrlData.publicUrl;
      }

      // 2. Insert the Announcement Record
      const payload: AnnouncementPayload = {
        text: formData.text.trim(),
        link: formData.link.trim(),
        is_active: formData.is_active,
        image_url: uploadedImageUrl,
      };

      const { error: dbError } = await supabase
        .from('announcements')
        .insert([payload]);

      if (dbError) throw dbError;

      alert('Global Signal Established Successfully.');
      
      // Reset Form
      setFormData({ text: '', link: '/announcements', is_active: true });
      clearImage();
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown archival error occurred';
      alert(`Broadcast Failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 md:p-20 flex flex-col items-center relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-rose-950/20 to-transparent pointer-events-none" />

      {/* Header Info */}
      <div className="w-full max-w-xl mb-12 flex justify-between items-end relative z-10">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter italic">
            Signal <span className="text-rose-600">Vault</span>
          </h1>
          <p className="text-[10px] font-mono text-neutral-600 uppercase tracking-[0.4em] mt-2">
            Establish New Communication Nodes
          </p>
        </div>
        <Link 
          href="/announcements" 
          className="text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-rose-600 transition-all flex items-center gap-2 group"
        >
          View Archive <HiArrowRight className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Admin Form Container */}
      <form 
        onSubmit={handleSubmit} 
        className="
          w-full max-w-xl space-y-8 relative z-10
          bg-neutral-900/20 p-10 md:p-12 
          rounded-[3rem] border border-white/5 
          backdrop-blur-3xl shadow-2xl
        "
      >
        {/* Toggle & Media Row */}
        <div className="flex justify-between items-center px-2">
          <button 
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
            className={`
              px-5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest 
              transition-all border-2
              ${formData.is_active 
                ? 'bg-rose-600/10 border-rose-600/50 text-rose-500 shadow-[0_0_20px_rgba(225,29,72,0.2)]' 
                : 'bg-neutral-800 border-white/5 text-neutral-500'}
            `}
          >
            {formData.is_active ? 'Status: Transmitting' : 'Status: Draft'}
          </button>

          <label className="cursor-pointer group flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-neutral-500 hover:text-rose-600 transition-colors">
            <HiPhotograph size={20} />
            {file ? 'Replace Media' : 'Attach Signal Visual'}
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
        </div>

        {/* Media Preview Window */}
        {preview && (
          <div className="relative w-full aspect-video rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl group bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Signal Preview" className="w-full h-full object-cover opacity-80" />
            <button 
              type="button"
              onClick={clearImage}
              className="absolute top-4 right-4 p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-rose-600 transition-colors"
            >
              <HiX size={16} />
            </button>
          </div>
        )}

        {/* Input Fields */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-neutral-600 ml-3">
              <HiSpeakerphone className="text-rose-600" /> Broadcast Content
            </label>
            <textarea 
              placeholder="System Update: Establishing new hi-fidelity nodes in the archive..." 
              required
              rows={3}
              value={formData.text}
              className="
                w-full p-6 bg-black/40 border border-white/5 
                rounded-3xl focus:border-rose-600 outline-none 
                transition-all text-sm leading-relaxed text-white
                placeholder:text-neutral-800
              "
              onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-neutral-600 ml-3">
              <HiLink className="text-rose-600" /> Redirection Link
            </label>
            <input 
              type="text" 
              placeholder="/announcements"
              value={formData.link}
              className="
                w-full p-5 bg-black/40 border border-white/5 
                rounded-3xl focus:border-rose-600 outline-none 
                transition-all text-sm font-mono text-neutral-400
              "
              onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
            />
          </div>
        </div>

        {/* Action Button */}
        <button 
          disabled={loading}
          className={`
            w-full py-6 rounded-3xl font-black uppercase tracking-[0.5em] text-[11px] 
            shadow-2xl transition-all active:scale-95
            ${loading 
              ? 'bg-neutral-800 text-neutral-700 cursor-not-allowed' 
              : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30 hover:shadow-rose-600/60'}
          `}
        >
          {loading ? 'Transmitting Data...' : 'Broadcast to Drive'}
        </button>

        {/* Footer Protocol */}
        <footer className="flex flex-col items-center pt-4 border-t border-white/5">
           <p className="text-[8px] text-neutral-700 uppercase tracking-[0.4em] font-bold">
            Protocol: 00-ANN-SIGNAL-2026
          </p>
           <p className="text-[8px] text-neutral-800 uppercase tracking-[0.3em] font-bold mt-1">
            Secure Archivist Terminal
          </p>
        </footer>
      </form>
    </div>
  );
}