'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/app/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { HiX, HiLightningBolt,HiMusicNote, HiUserCircle, HiChevronRight } from 'react-icons/hi';
import Image from 'next/image';

interface LeaderboardUser {
  id: string;
  username: string;
  avatar_url: string | null;
  total_score: number;
  post_count: number;
}

export default function SuperfanModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const fetchLeaders = async () => {
      setLoading(true);
      const { data } = await supabase.from('fanwall_leaderboard').select('*');
      if (data) setLeaders(data as LeaderboardUser[]);
      setLoading(false);
    };
    fetchLeaders();
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] bg-black overflow-hidden h-[100dvh] flex flex-col">
          {/* FIXED HEADER */}
          <div className="relative z-[130] w-full flex justify-between items-center p-4 sm:p-6 bg-gradient-to-b from-black/95 to-black/50 backdrop-blur-sm">
             <div className="flex items-center gap-2">
               <HiLightningBolt className="text-yellow-500 animate-pulse" size={20} />
               <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] italic">Archive FanWall</span>
             </div>
             <button onClick={onClose} className="p-2 sm:p-3 bg-white/10 rounded-full backdrop-blur-md hover:bg-red-600 transition-colors">
               <HiX size={18} />
             </button>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            /* HORIZONTAL SNAP CONTAINER */
            <div 
              ref={scrollRef}
              className="flex-1 flex overflow-x-auto snap-x snap-mandatory scrollbar-hide scroll-smooth pb-8"
            >
              {leaders.map((fan, index) => (
                <div 
                  key={fan.id} 
                  className="min-w-full h-full snap-center flex flex-col items-center justify-center p-4 sm:p-8 relative"
                >
                  {/* Background Accents - Mobile Safe */}
                  <div className={`absolute inset-0 opacity-5 pointer-events-none blur-xl rounded-full max-w-[90vw]
                    ${index === 0 ? 'bg-yellow-500' : index < 3 ? 'bg-red-600' : 'bg-neutral-500'}`} 
                  />

                  {/* SCORE BOX - Responsive */}
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    className="mb-6 sm:mb-8 text-center"
                  >
                    <div className="bg-white text-black px-4 sm:px-6 py-2 sm:py-3 inline-block shadow-2xl">
                      <span className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tighter leading-none font-mono">
                        {fan.total_score.toString()}
                      </span>
                    </div>
                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] mt-3 text-yellow-500">
                      Archive Points
                    </p>
                  </motion.div>

                  {/* CENTER AVATAR - Mobile Responsive */}
                  <div className="relative mb-8 sm:mb-12 w-48 h-48 sm:w-64 sm:h-64 max-w-[80vw] max-h-[80vw]">
                    <div className={`relative w-full h-full rounded-full p-1 sm:p-2 border-[4px] sm:border-[6px] flex items-center justify-center
                      ${index === 0 ? 'border-yellow-500' : 'border-white'}`}>
                       <div className="absolute inset-2 sm:inset-4 border border-white/10 rounded-full" />
                       <div className="relative w-full h-full rounded-full overflow-hidden bg-neutral-900">
                         {fan.avatar_url ? (
                           <Image src={fan.avatar_url} alt={fan.username} fill unoptimized className="object-cover" />
                         ) : (
                           <HiUserCircle className="w-full h-full text-neutral-800" />
                         )}
                       </div>
                    </div>
                    
                    <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 sm:px-4 py-1 font-black text-[10px] sm:text-sm skew-x-[-12deg] shadow-xl whitespace-nowrap
                      ${index === 0 ? 'bg-yellow-500 text-black' : 'bg-white text-black'}`}>
                      {index === 0 ? 'TOP ARCHIVIST' : `#${index + 1}`}
                    </div>
                  </div>

                  {/* USER INFO - Responsive */}
 <div className="text-center mb-6 sm:mb-8">
   <div className="flex items-center justify-center gap-2 mb-2">
     <HiMusicNote className="text-yellow-500 text-xl sm:text-2xl" />
     <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight italic">
       {fan.username}
     </h2>
   </div>
</div>

                  {/* SWIPE INDICATOR - Mobile Safe */}
                 {/* SWIPE INDICATOR - Fixed Spacing */}
{index < leaders.length - 1 && (
  <div className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 opacity-70">
     <HiChevronRight size={24} className="text-yellow-500 animate-bounce-x" />
     <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-white rotate-90 whitespace-nowrap">Swipe</span>
  </div>
)}

                </div>
              ))}
            </div>
          )}

          {/* FOOTER - Mobile Responsive */}
          <div className="p-4 sm:p-8 flex flex-col items-center gap-4 sm:gap-6">
            <div className="flex justify-center gap-1 sm:gap-2 w-full max-w-xs">
              {leaders.map((_, i) => (
                <div key={i} className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 flex-shrink-0
                  ${i === 0 ? 'w-8 sm:w-12 bg-yellow-500 shadow-md' : 'w-2 sm:w-4 bg-white/20'}`} />
              ))}
            </div>
            
            <p className="text-[8px] sm:text-[9px] font-bold text-center text-white/50 uppercase tracking-[0.15em] max-w-[260px] leading-tight">
              Earn points by liking, rating, posting, and commenting
            </p>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
