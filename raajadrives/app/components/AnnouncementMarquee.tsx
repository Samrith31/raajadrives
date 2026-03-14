'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { supabase } from '@/app/lib/supabase';
import { HiX, HiExternalLink, HiSpeakerphone } from 'react-icons/hi';

/* --- INTERFACE --- */
interface Announcement {
  id: string;
  text: string;
  link: string;
  image_url?: string | null;
  created_at: string;
}

export default function AnnouncementMarquee() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSignal, setSelectedSignal] = useState<Announcement | null>(null);

  useEffect(() => {
    async function fetchSignals() {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
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

  const loopItems = [...announcements, ...announcements, ...announcements];

  return (
    <>
      <div className="relative w-full bg-[#0A0A0B] border-y border-white/5 overflow-hidden py-4 md:py-8 group">
        <div className="flex whitespace-nowrap">
          <motion.div
            drag="x"
            dragConstraints={{ left: -3000, right: 0 }}
            dragElastic={0.05}
            animate={{ x: ["0%", "-33.33%"] }}
            transition={{
              ease: "linear",
              duration: Math.max(announcements.length * 12, 25),
              repeat: Infinity,
            }}
            whileHover={{ animationPlayState: "paused" }}
            whileTap={{ animationPlayState: "paused" }}
            className="flex items-center gap-4 md:gap-12 pr-4 md:pr-12 touch-pan-y"
          >
            {loopItems.map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                onClick={() => setSelectedSignal(item)}
                className="group relative block cursor-pointer select-none"
              >
                <div className="relative w-[280px] md:w-[500px] h-[140px] md:h-[200px] overflow-hidden rounded-2xl md:rounded-[2.5rem] border border-white/10 bg-neutral-900 shadow-2xl transition-all hover:border-red-600/40">
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover opacity-60 transition-transform duration-1000 group-hover:scale-110"
                      draggable={false}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  <div className="relative z-10 flex flex-col justify-end h-full p-5 md:p-8">
                    <div className="flex items-center gap-2 mb-1.5 md:mb-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                      <span className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] text-red-500">Announcement</span>
                    </div>
                    <h3 className="text-xs md:text-lg font-bold text-white leading-tight line-clamp-2 whitespace-normal max-w-[400px]">
                      {item.text}
                    </h3>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        <Link
          href="/announcements"
          className="absolute right-0 top-0 bottom-0 px-4 md:px-8 bg-neutral-950/80 backdrop-blur-3xl flex items-center border-l border-white/10 text-[9px] md:text-xs font-black uppercase tracking-[0.25em] text-neutral-400 hover:text-red-500 transition-all z-20"
        >
          <span className="[writing-mode:vertical-lr] md:[writing-mode:horizontal-tb] rotate-180 md:rotate-0">View All</span>
        </Link>
      </div>

      {/* --- REFINED MODAL --- */}
      <AnimatePresence>
        {selectedSignal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setSelectedSignal(null)} 
              className="absolute inset-0 bg-black/90 backdrop-blur-md" 
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 10 }} 
              /* Width reduced on mobile to w-[94%] and max-height set to 85vh */
              className="relative w-[94%] md:w-full max-w-4xl bg-[#0F0F10] border border-white/10 rounded-3xl md:rounded-[2.5rem] overflow-hidden shadow-2xl max-h-[85vh] md:max-h-[90vh] flex flex-col"
            >
              {/* Close Button: Slightly smaller on mobile */}
              <button 
                onClick={() => setSelectedSignal(null)} 
                className="absolute top-4 right-4 z-20 p-2 md:p-3 bg-black/60 hover:bg-red-600 text-white rounded-full transition-colors backdrop-blur-md shadow-lg"
              >
                <HiX size={18} />
              </button>

              <div className="flex flex-col md:flex-row h-full overflow-y-auto md:overflow-hidden">
                {/* Visual Side: Height reduced for mobile (h-[200px]) */}
                <div className="relative w-full md:w-1/2 h-[200px] md:h-full shrink-0 bg-neutral-900 border-b md:border-b-0 md:border-r border-white/5">
                  {selectedSignal.image_url ? (
                    <img src={selectedSignal.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <HiSpeakerphone className="text-neutral-800" size={60} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>

                {/* Text Side: Tighter padding on mobile */}
                <div className="w-full md:w-1/2 p-6 md:p-12 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-4 md:mb-6">
                    <div className="px-2 py-0.5 rounded-full bg-red-600/10 border border-red-600/30">
                      <span className="text-[9px] font-black uppercase tracking-[0.1em] text-red-500">Announcement</span>
                    </div>
                    <time className="text-[9px] font-mono text-neutral-600 uppercase">
                      {new Date(selectedSignal.created_at).toLocaleDateString()}
                    </time>
                  </div>

                  <h2 className="text-xl md:text-4xl font-bold uppercase tracking-tight leading-tight text-white mb-6 md:mb-8 italic">
                    {selectedSignal.text}
                  </h2>

                  <Link 
                    href={selectedSignal.link || '#'} 
                    className="group inline-flex items-center justify-between w-full p-4 md:p-6 bg-white/[0.03] border border-white/5 rounded-xl md:rounded-2xl hover:bg-red-600 transition-all duration-300 shadow-lg"
                  >
                    <span className="font-bold uppercase tracking-widest text-[10px] md:text-xs">Learn More</span>
                    <HiExternalLink className="text-neutral-500 group-hover:text-white transition-all" size={18} />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}