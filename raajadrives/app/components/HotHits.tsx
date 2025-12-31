'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/app/lib/supabase';
import type { Release } from '@/app/data/release';
import AlbumCard from '@/app/components/AlbumCard';
import { HiFire } from 'react-icons/hi';
import { motion } from 'framer-motion';

/* ---------- STRICT INTERFACE ---------- */
interface HotHitRpcRow {
  id: string;
  title: string;
  artist: string;
  slug: string;
  cover_url: string | null;
  is_single: boolean | null;
  type: string | null;
}

export default function HotHits() {
  const [hits, setHits] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    async function fetchHotHits() {
      const { data, error } = await supabase.rpc('get_hot_hits');
      if (!error && data) {
        const rows = data as HotHitRpcRow[];
        const formatted: Release[] = rows.map((item) => ({
          id: item.id,
          title: item.title,
          artist: item.artist,
          slug: item.slug,
          type: item.is_single ? 'single' : 'cd-flac',
          isSingle: Boolean(item.is_single),
          downloadUrl: `/download/${item.slug}`,
          cover_url: item.cover_url ?? '/images/logo-2.jpeg',
          cover: item.cover_url ?? '/images/logo-2.jpeg'
        }));
        setHits(formatted);
      }
      setLoading(false);
    }
    fetchHotHits();
  }, []);

  // Auto-scroll logic
  useEffect(() => {
    if (loading || isPaused || hits.length === 0) return;
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        if (scrollLeft >= scrollWidth - clientWidth - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [loading, isPaused, hits]);

  if (loading || hits.length === 0) return null;

  return (
    <section className="py-12 relative bg-black overflow-hidden">
      {/* --- HEADER (EXACT MATCH TO LATEST DROPS) --- */}
      <div className="flex items-end justify-between mb-8 px-6 md:px-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="text-xs font-bold tracking-widest text-red-500 uppercase">
              Trending Now
            </span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white">
            Hot <span className="text-neutral-500">Hits</span>
          </h2>
        </div>
      </div>

      {/* --- CONTENT RAIL --- */}
      <div 
        ref={scrollRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="flex gap-6 md:gap-8 overflow-x-auto px-6 md:px-10 pb-10 scrollbar-hide snap-x select-none"
      >
        {hits.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative flex-none w-[220px] md:w-[280px] snap-center group"
          >
            {/* SOLID RANK BADGE (Top-Right) */}
            <div className="absolute top-3 right-3 z-50">
              <div className="bg-red-600 text-white px-3 py-1 rounded-lg shadow-xl flex items-center gap-1.5 border border-white/20">
                <HiFire size={12} className="animate-pulse" />
                <span className="text-[10px] font-black italic">#{index + 1}</span>
              </div>
            </div>

            {/* ALBUM CARD */}
            <div className="relative z-10 transition-transform duration-300 group-hover:scale-[1.02]">
              <AlbumCard
                album={item}
                userRating={9.9 - index * 0.1}
              />
            </div>
          </motion.div>
        ))}
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}