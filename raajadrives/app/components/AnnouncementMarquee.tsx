'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { supabase } from '@/app/lib/supabase';
import { HiArrowRight } from 'react-icons/hi';

/* --- INTERFACE --- */
interface Announcement {
  id: string;
  text: string;
  link: string;
  image_url?: string | null;
}

export default function AnnouncementMarquee() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSignals() {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('id, text, link, image_url')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAnnouncements(data || []);
      } catch (err) {
        console.error('Error fetching marquee data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSignals();
  }, []);

  if (loading || announcements.length === 0) return null;

  // Triple the items for a smoother loop on very wide or very small screens
  const loopItems = [...announcements, ...announcements, ...announcements];

  return (
    <div className="relative w-full bg-[#0A0A0B] border-y border-white/5 overflow-hidden py-4 md:py-8 group">
      
      {/* 1. THE MARQUEE TRACK */}
      <div className="flex whitespace-nowrap">
        <motion.div
          animate={{ x: ["0%", "-33.33%"] }}
          transition={{
            ease: "linear",
            duration: Math.max(announcements.length * 10, 20),
            repeat: Infinity,
          }}
          // Pauses the scroll when user touches/hovers so they can read
          whileHover={{ animationPlayState: "paused" }}
          whileTap={{ animationPlayState: "paused" }}
          className="flex items-center gap-4 md:gap-16 pr-4 md:pr-16"
        >
          {loopItems.map((item, idx) => (
            <Link
              key={`${item.id}-${idx}`}
              href={item.link || '/announcements'}
              className="group relative block"
            >
              {/* RESPONSIVE SIZING: 300px width on mobile, 560px on desktop */}
              <div className="
                relative 
                w-[300px] md:w-[560px] 
                h-[140px] md:h-[180px] 
                overflow-hidden rounded-2xl md:rounded-3xl 
                border border-white/10 
                bg-neutral-900
              ">

                {/* IMAGE */}
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt="announcement"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1500ms] group-hover:scale-110 opacity-60 group-hover:opacity-100"
                  />
                )}

                {/* GRADIENT OVERLAYS (Responsive Intensity) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-transparent to-transparent" />

                {/* TEXT CONTENT */}
                <div className="relative z-10 flex flex-col justify-end h-full p-5 md:p-8">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                    <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-red-500">
                      Announcement
                    </span>
                  </div>

                  <h3 className="
                    text-sm md:text-xl font-bold text-white leading-tight 
                    max-w-[240px] md:max-w-[420px] 
                    whitespace-normal line-clamp-2
                  ">
                    {item.text}
                  </h3>
                </div>

                {/* HOVER ARROW (Hidden on Mobile) */}
                <div className="hidden md:flex absolute right-8 bottom-8 w-10 h-10 rounded-full bg-red-600 items-center justify-center text-white opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                  <HiArrowRight size={20} />
                </div>
              </div>
            </Link>
          ))}
        </motion.div>
      </div>

      {/* 2. VIEW ALL (Floating Glass Pill for Mobile) */}
      <Link
        href="/announcements"
        className="
          absolute right-0 top-0 bottom-0 
          px-4 md:px-8 
          bg-neutral-950/80 backdrop-blur-2xl 
          flex items-center 
          border-l border-white/10 
          text-[9px] md:text-xs font-black uppercase tracking-[0.25em] text-neutral-500 
          hover:text-red-500 transition-all z-20
        "
      >
        <span className="[writing-mode:vertical-lr] md:[writing-mode:horizontal-tb] rotate-180 md:rotate-0">
          View All
        </span>
      </Link>

      {/* Fade out edges for premium look */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#0A0A0B] to-transparent pointer-events-none z-10 md:hidden" />
    </div>
  );
}