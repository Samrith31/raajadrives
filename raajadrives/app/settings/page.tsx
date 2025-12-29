'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import AvatarUpload from '@/app/components/AvatarUpload';
import { HiCheck, HiUser, HiPencil, HiArrowLeft } from 'react-icons/hi';
import Link from 'next/link';

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [profile, setProfile] = useState({
    username: '',
    bio: '',
    avatar_url: ''
  });

  // 1. Fetch current profile data on mount
  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, bio, avatar_url')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setProfile({
          username: data.username || '',
          bio: data.bio || '',
          avatar_url: data.avatar_url || ''
        });
      }
      setFetching(false);
    };

    fetchProfile();
  }, [user]);

  // 2. Save logic for Text Fields (Username/Bio)
  const handleSave = async () => {
    if (!user) return;
    setLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        username: profile.username.trim(),
        bio: profile.bio.trim(),
      })
      .eq('id', user.id);

    if (error) {
      alert("Error: Username might be taken or connection failed.");
    } else {
      alert("Archive Identity Updated.");
      router.refresh(); // Refresh the server components
    }
    setLoading(false);
  };

  if (fetching) return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950">
      <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-white pb-24">
      <div className="max-w-xl mx-auto px-6 pt-12">
        
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-12">
          <Link href={`/profile/${profile.username}`} className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors">
            <HiArrowLeft size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest">Back to Profile</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="h-3 w-[2px] bg-red-600" />
            <h1 className="text-[11px] font-black uppercase tracking-[0.4em] text-neutral-400">Settings</h1>
          </div>
        </div>

        <div className="space-y-16">
          {/* SECTION 1: AVATAR */}
          <section className="flex flex-col items-center">
            <AvatarUpload 
              currentUrl={profile.avatar_url} 
              onUploadSuccess={(url) => setProfile({ ...profile, avatar_url: url || '' })} 
            />
          </section>

          {/* SECTION 2: TEXT FIELDS */}
          <section className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 ml-2 block">
                Archivist Username
              </label>
              <div className="relative group">
                <HiUser className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-red-500 transition-colors" />
                <input 
                  type="text"
                  value={profile.username}
                  onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                  className="w-full bg-neutral-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-sm focus:outline-none focus:border-red-600/50 focus:bg-neutral-900 transition-all"
                  placeholder="Enter username..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 ml-2 block">
                Archivist Bio
              </label>
              <div className="relative group">
                <HiPencil className="absolute left-5 top-6 text-neutral-600 group-focus-within:text-red-500 transition-colors" />
                <textarea 
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  rows={4}
                  className="w-full bg-neutral-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-sm focus:outline-none focus:border-red-600/50 focus:bg-neutral-900 transition-all resize-none"
                  placeholder="Describe your musical frequency..."
                />
              </div>
            </div>
          </section>

          {/* SECTION 3: SAVE BUTTON */}
          <button 
            onClick={handleSave}
            disabled={loading}
            className="w-full py-5 bg-red-600 rounded-2xl flex items-center justify-center gap-3 group hover:bg-red-500 active:scale-[0.98] transition-all shadow-[0_15px_40px_rgba(220,38,38,0.2)]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <HiCheck size={20} className="group-hover:scale-125 transition-transform" />
                <span className="text-[11px] font-black uppercase tracking-[0.3em]">Save Archive Identity</span>
              </>
            )}
          </button>
        </div>

        {/* Branding Footer */}
        <p className="mt-20 text-center text-[9px] text-neutral-800 font-bold uppercase tracking-[0.5em]">
          Raajadrives Identity Protocol v1.0
        </p>
      </div>
    </div>
  );
}