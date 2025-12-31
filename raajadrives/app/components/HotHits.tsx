'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import type { Release } from '@/app/data/release';
import AlbumCard from '@/app/components/AlbumCard';
import { HiTrendingUp } from 'react-icons/hi';
import { motion } from 'framer-motion';

/* ---------- RPC ROW TYPE ---------- */
interface HotHitRpcRow {
  id: string;
  title: string;
  artist: string;
  slug: string;
  cover_url: string | null;
  is_single: boolean | null;
  type: string | null;
}

/* ---------- SAFE TYPE MAPPER ---------- */
function mapToReleaseType(row: HotHitRpcRow): Release['type'] {
  if (row.is_single) return 'single';
  if (row.type === 'lprip') return 'lprip';
  if (row.type === 'cdrip') return 'cdrip';
  return 'cd-flac'; 
}

export default function HotHits() {
  const [hits, setHits] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHotHits() {
      // ✅ FIX: Remove the generic <HotHitRpcRow[]> here
      const { data, error } = await supabase.rpc('get_hot_hits');

      if (!error && data) {
        // ✅ CAST HERE: Treat data as our RPC row type
        const rows = data as HotHitRpcRow[];
        
        const formatted: Release[] = rows.map((item) => ({
          id: item.id,
          title: item.title,
          artist: item.artist,
          slug: item.slug,
          type: mapToReleaseType(item),
          isSingle: Boolean(item.is_single),
          downloadUrl: `/download/${item.slug}`,
          cover_url: item.cover_url ?? '/images/logo-2.jpeg',
          cover: item.cover_url ?? '/images/logo-2.jpeg'
        }));

        setHits(formatted);
      } else if (error) {
        console.error("RPC Error:", error.message);
      }

      setLoading(false);
    }

    fetchHotHits();
  }, []);

  if (loading || hits.length === 0) return null;

  return (
    <section className="py-12 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-1/2 h-full bg-red-600/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-4 mb-8 px-6">
        <div className="p-3 bg-red-600 rounded-2xl shadow-[0_0_25px_rgba(220,38,38,0.4)]">
          <HiTrendingUp className="text-white text-2xl" />
        </div>
        <div>
          <h2 className="text-white text-2xl font-black uppercase italic tracking-tighter">
            Hot Hits
          </h2>
          <p className="text-[10px] text-neutral-500 uppercase tracking-[0.4em] font-black mt-1.5">
            Top Trending Archive
          </p>
        </div>
      </div>

      {/* Horizontal Scroll */}
      <div className="flex gap-6 overflow-x-auto px-6 pb-10 scrollbar-hide snap-x">
        {hits.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            viewport={{ once: true }}
            className="relative flex-none w-[240px] md:w-[300px] snap-center group"
          >
            {/* ✅ GLASSMORPISM RANK BADGE */}
            <div className="absolute -top-3 -left-3 z-50 pointer-events-none">
              <div className="relative">
                {/* Neon Glow Layer */}
                <div className="absolute inset-0 bg-red-600 rounded-2xl blur-md opacity-20 group-hover:opacity-60 transition-opacity" />
                
                {/* Glass Layer */}
                <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 w-12 h-12 md:w-14 md:h-14 rounded-2xl flex flex-col items-center justify-center shadow-2xl -rotate-12 group-hover:rotate-0 transition-all duration-500">
                  <span className="text-[8px] text-red-500 font-black uppercase tracking-tighter leading-none mb-0.5">
                    Rank
                  </span>
                  <span className="text-white text-xl md:text-2xl font-black italic leading-none">
                    #{index + 1}
                  </span>
                </div>
              </div>
            </div>

            <AlbumCard
              album={item}
              userRating={9.9 - index * 0.2}
            />

            <div className="absolute -bottom-4 inset-x-8 h-8 bg-red-600/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        ))}
      </div>
    </section>
  );
}