'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import { HiArchive, HiArrowRight, HiUserCircle } from 'react-icons/hi';
import { motion } from 'framer-motion';
import Link from 'next/link';

/* ---------- TYPES (Inlined for single-file use) ---------- */
export interface Crate {
  id: string;
  created_at: string;
  user_id: string;
  title: string;
  description: string;
  crate_id_label: string;
  is_public: boolean;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

export default function ArchiveCrates() {
  const [crates, setCrates] = useState<Crate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCrates() {
      // Fetching crates along with the creator's profile data
      const { data, error } = await supabase
        .from('crates')
        .select(`
          *,
          profiles ( username, avatar_url )
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (!error && data) {
        setCrates(data as unknown as Crate[]);
      } else if (error) {
        console.error('Crate Fetch Error:', error.message);
      }
      setLoading(false);
    }

    fetchCrates();
  }, []);

  if (loading || crates.length === 0) return null;

  return (
    <section className="py-20 bg-black">
      {/* --- HEADER (STRICT MATCH TO LATEST DROPS) --- */}
      <div className="flex items-end justify-between mb-10 px-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="text-xs font-bold tracking-widest text-red-500 uppercase">
              Archivist Selections
            </span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white">
            Archive <span className="text-neutral-500">Crates</span>
          </h2>
        </div>
        
        <Link 
          href="/crates" 
          className="hidden md:block text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em] hover:text-red-500 transition-colors"
        >
          View All Collections
        </Link>
      </div>

      {/* --- SOLID SLATE GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-8">
        {crates.map((crate) => (
          <Link href={`/crates/${crate.id}`} key={crate.id} className="block group">
            <motion.div
              whileHover={{ y: -8 }}
              className="relative h-full bg-neutral-900 border border-white/5 p-8 rounded-[2rem] transition-all duration-500 group-hover:border-red-600/40 group-hover:bg-neutral-900/80 shadow-2xl"
            >
              {/* Crate Header: Solid ID Badge & Icon */}
              <div className="flex justify-between items-start mb-8">
                <div className="bg-red-600 p-4 rounded-2xl shadow-[0_10px_30px_rgba(220,38,38,0.3)] group-hover:scale-110 transition-transform duration-500">
                  <HiArchive className="text-white text-2xl" />
                </div>
                <span className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.3em] font-mono group-hover:text-red-500 transition-colors">
                  {crate.crate_id_label}
                </span>
              </div>

              {/* Title & Description */}
              <h3 className="text-white text-2xl font-black italic uppercase tracking-tighter mb-3 leading-tight group-hover:text-red-500 transition-colors">
                {crate.title}
              </h3>
              <p className="text-neutral-500 text-xs leading-relaxed mb-10 line-clamp-2 font-medium">
                {crate.description || 'No description provided for this collection.'}
              </p>

              {/* Footer: User Identity & Action */}
              <div className="flex items-center justify-between pt-6 border-t border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-neutral-800 border border-white/10 overflow-hidden shadow-inner">
                    {crate.profiles?.avatar_url ? (
                      <img 
                        src={crate.profiles.avatar_url} 
                        alt={crate.profiles.username} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <HiUserCircle className="text-neutral-600 w-full h-full" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-red-600 uppercase tracking-tighter leading-none mb-1">
                      Archivist
                    </span>
                    <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest leading-none">
                      @{crate.profiles?.username || 'unknown'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-widest group-hover:gap-4 transition-all">
                  Open <HiArrowRight className="text-sm" />
                </div>
              </div>

              {/* Bottom Subtle Reflection */}
              <div className="absolute -bottom-px left-10 right-10 h-px bg-gradient-to-r from-transparent via-red-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          </Link>
        ))}
      </div>
    </section>
  );
}