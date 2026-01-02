'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import { useAuth } from '@/app/context/AuthContext';
import Image from 'next/image';
import {
  HiSearch,
  HiUserCircle,
  HiX,
  HiMusicNote,
  HiPlus,
} from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';

interface ReleaseOption {
  id: string;
  title: string;
  artist: string;
  cover_url: string;
}

export default function PostCreatorModal({
  onPostCreated,
}: {
  onPostCreated: () => void;
}) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ReleaseOption[]>([]);
  const [selectedRelease, setSelectedRelease] =
    useState<ReleaseOption | null>(null);

  useEffect(() => {
    async function getProfile() {
      if (user?.id) {
        const { data } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single();
        if (data) setAvatarUrl(data.avatar_url);
      }
    }
    getProfile();
  }, [user]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setIsOpen(false);
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, []);

  useEffect(() => {
    const run = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      const { data } = await supabase
        .from('releases')
        .select('id,title,artist,cover_url')
        .ilike('title', `%${searchQuery}%`)
        .limit(12);

      if (data) setSearchResults(data as ReleaseOption[]);
    };

    const t = setTimeout(run, 250);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleSubmit = async () => {
    if (!user || !selectedRelease || !content.trim()) return;

    setLoading(true);

    const { error } = await supabase.from('posts').insert([
      {
        user_id: user.id,
        content: content.trim(),
        release_id: selectedRelease.id,
        type: 'post',
      },
    ]);

    if (!error) {
      setContent('');
      setSearchQuery('');
      setSelectedRelease(null);
      onPostCreated();
      setIsOpen(false);
    }

    setLoading(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-30 right-8 md:bottom-8 md:right-115 w-14 h-14 bg-red-600 text-white rounded-full shadow-[0_8px_25px_rgba(220,38,38,0.5)] flex items-center justify-center transition-all active:scale-90 z-[9999] hover:scale-110"
      >
        <HiMusicNote size={26} />
        <span className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 border-2 border-red-600">
          <HiPlus size={10} className="text-red-600" />
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[10000] flex justify-center items-start pt-16 sm:pt-24 px-4">
            <motion.div
              onClick={() => setIsOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-neutral-950/90 backdrop-blur-xl"
            />

            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.96 }}
              className="relative w-full max-w-2xl bg-black border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
 <div className="flex items-center justify-between p-6 border-b border-white/5 bg-neutral-900/10">
  <div>
    {/* Italic Serif Title */}
    <h2 className="text-white text-lg font-medium italic tracking-tight font-serif">
      Post about <span className="font-black not-italic text-red-600">Raaja</span>
    </h2>
  <p className="text-[10px] text-neutral-500 uppercase tracking-[0.25em] mt-1">

                    Select Song . Write about it.

                  </p>
  </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="text-neutral-500 hover:text-white transition-colors"
                >
                  <HiX size={22} />
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                {!selectedRelease && (
                  <div className="space-y-4">
                    {/* SLIMMER SEARCH BAR */}
                    <div className="flex items-center gap-3 px-5 py-3 bg-neutral-900/40 rounded-xl border border-white/5 focus-within:border-red-600/50 transition-all">
                      <HiSearch className="text-neutral-500" size={18} />
                      <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search Single or Album…"
                        autoFocus
                        className="bg-transparent w-full text-sm font-medium outline-none text-white placeholder:text-neutral-700"
                      />
                    </div>

                    <AnimatePresence>
                      {searchResults.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                        >
                          {searchResults.map((r) => (
                            <button
                              key={r.id}
                              onClick={() => {
                                setSelectedRelease(r);
                                setSearchResults([]);
                                setSearchQuery('');
                              }}
                              className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-900/30 hover:bg-neutral-800/50 border border-white/5 transition-all text-left"
                            >
                              <div className="relative w-14 h-14 rounded-xl overflow-hidden">
                                <Image
                                  src={r.cover_url}
                                  alt=""
                                  fill
                                  unoptimized={true}
                                  className="object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="text-white font-black uppercase text-sm truncate">
                                  {r.title}
                                </p>
                                <p className="text-neutral-400 text-[10px] uppercase tracking-widest mt-1">
                                  {r.artist}
                                </p>
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {selectedRelease && (
                 <motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  className="space-y-5"
>
  {/* SLIMMER CARD DESIGN */}
  <div className="flex items-center gap-4 p-3 rounded-xl bg-neutral-900/40 border-l-2 border-red-600 border-y border-r border-white/5 shadow-xl">
    
    {/* Reduced image size from w-20 to w-14 */}
    <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-white/10 shadow-2xl">
      <Image
        src={selectedRelease.cover_url}
        alt=""
        fill
        unoptimized={true}
        className="object-cover"
      />
    </div>

    <div className="flex-1 min-w-0">
      {/* Slimmer, tighter title font */}
      <p className="text-white font-black uppercase text-[14px] truncate tracking-tight leading-none">
        {selectedRelease.title}
      </p>
      
      {/* Technical Monospace font for the artist */}
      <p className="text-red-500/80 font-mono text-[9px] uppercase tracking-[0.2em] mt-1.5 font-bold">
        {selectedRelease.artist}
      </p>
    </div>

    {/* Minimalist close button */}
    <button
      onClick={() => setSelectedRelease(null)}
      className="p-2 mr-1 rounded-lg text-neutral-600 hover:text-white hover:bg-red-600/20 transition-all"
    >
      <HiX size={16} />
    </button>
  </div>

                    <div className="flex gap-4">
                      {avatarUrl ? (
                        <div className="relative w-[42px] h-[42px] rounded-full overflow-hidden shrink-0 border border-white/10">
                          <Image 
                            src={avatarUrl} 
                            alt="Profile" 
                            fill 
                            unoptimized={true}
                            className="object-cover" 
                          />
                        </div>
                      ) : (
                        <HiUserCircle
                          size={42}
                          className="text-neutral-700 shrink-0"
                        />
                      )}
                      
                      <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="What did this music do to you?"
                        className="w-full bg-transparent text-white text-[18px] leading-relaxed font-medium outline-none resize-none min-h-[160px] placeholder:text-neutral-600"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={handleSubmit}
                        disabled={loading || !content.trim()}
                        className="bg-red-600 disabled:opacity-40 px-8 py-3 rounded-full text-xs font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-lg shadow-red-600/40"
                      >
                        {loading ? 'Posting…' : 'Post'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-30" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #dc2626;
          border-radius: 10px;
        }
      `}</style>
    </>
  );
}