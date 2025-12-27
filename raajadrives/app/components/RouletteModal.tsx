'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { HiMusicNote, HiX, HiRefresh, HiChevronRight } from 'react-icons/hi';

interface SingleSong {
  id: string;
  title: string;
  artist: string;
  slug: string;
  cover_url: string | null;
}

export default function RouletteModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [songs, setSongs] = useState<SingleSong[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<SingleSong | null>(null);
  const [history, setHistory] = useState<SingleSong[]>([]); 
  const controls = useAnimation();

  useEffect(() => {
    if (isOpen) {
      const fetchSingles = async () => {
        const { data } = await supabase
          .from('releases')
          .select('id, title, artist, slug, cover_url')
          .eq('is_single', true);

        if (data && data.length > 0) {
          const shuffled = [...data].sort(() => 0.5 - Math.random());
          let selected5 = shuffled.slice(0, 5);
          
          while (selected5.length < 5) {
            selected5 = [...selected5, ...data];
          }
          setSongs(selected5.slice(0, 5));
        }
      };
      fetchSingles();
    }
  }, [isOpen]);

  const handleSpin = async () => {
    if (spinning || songs.length === 0) return;

    setSpinning(true);
    setWinner(null);

    const rotations = 8 + Math.floor(Math.random() * 4);
    const extraDegrees = Math.floor(Math.random() * 360);
    const totalRotation = (rotations * 360) + extraDegrees;
    
    // Snappy 3-second spin
    await controls.start({
      rotate: totalRotation,
      transition: { 
        duration: 3, 
        ease: [0.12, 0.8, 0.32, 1] 
      }
    });

    const finalAngle = totalRotation % 360;
    const segmentIndex = Math.floor(((360 - finalAngle) % 360) / 72);
    
    const selected = songs[segmentIndex];
    setWinner(selected);
    setHistory(prev => [selected, ...prev.filter(s => s.id !== selected.id).slice(0, 3)]);
    setSpinning(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={!spinning ? onClose : undefined}
            className="absolute inset-0 bg-black/80 backdrop-blur-[15px]"
          />

          <motion.div 
            initial={{ scale: 0.8, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 40 }}
            className="relative w-full max-w-[440px] bg-neutral-900 border border-white/10 rounded-[3.5rem] p-8 md:p-10 shadow-2xl overflow-hidden"
          >
            {/* --- HEADER AREA WITH LOGO --- */}
            <div className="relative z-10 flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 shrink-0">
                  {/* Outer Glow Effect */}
                  <div className="absolute inset-0 bg-red-600/20 rounded-full blur-md animate-pulse" />
                  {/* Logo Container */}
                  <div className="relative w-full h-full rounded-full border-2 border-white/10 overflow-hidden shadow-lg shadow-black/50">
                     <Image
                                    src="/images/logo-2.jpeg" 
                                    alt="Raaja Drives Logo"
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                </div>
                <div>
                  <h2 className="font-black uppercase tracking-tighter text-2xl leading-none text-white italic">Daily Spin</h2>
                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-[0.2em] mt-1 italic">Raja Drives Exclusive</p>
                </div>
              </div>
              <button onClick={onClose} disabled={spinning} className="p-2 text-neutral-600 hover:text-white transition-colors">
                <HiX size={32} />
              </button>
            </div>

            <div className="flex flex-col items-center">
              {/* THE SPINNING WHEEL */}
              <div className="relative w-72 h-72 md:w-80 md:h-80 mb-10 flex items-center justify-center">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-50">
                   <div className="w-0 h-0 border-l-[18px] border-l-transparent border-r-[18px] border-r-transparent border-t-[35px] border-t-red-600 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
                </div>
                
                <motion.div
                  animate={controls}
                  className="w-full h-full rounded-full border-[10px] border-black relative overflow-hidden bg-neutral-950 shadow-inner"
                  style={{ 
                    background: 'conic-gradient(from 0deg, #171717, #0a0a0a, #171717, #0a0a0a, #171717)' 
                  }}
                >
                  {songs.map((song, i) => (
                    <div 
                      key={`${song.id}-${i}`}
                      className="absolute inset-0 flex justify-center pt-8"
                      style={{ transform: `rotate(${i * 72 + 36}deg)` }}
                    >
                      <div className="relative w-16 h-16 md:w-20 md:h-20 bg-neutral-800 rounded-full border-2 border-white/10 overflow-hidden shadow-2xl rotate-[-36deg]">
                        <Image src={song.cover_url || '/placeholder.jpg'} alt="" fill className="object-cover" />
                      </div>
                    </div>
                  ))}

                  {[0, 72, 144, 216, 288].map((deg) => (
                    <div 
                      key={deg} 
                      className="absolute top-1/2 left-1/2 w-[2px] h-1/2 bg-white/5 origin-top" 
                      style={{ transform: `rotate(${deg}deg)` }} 
                    />
                  ))}
                </motion.div>

                <div className="absolute w-16 h-16 bg-neutral-950 rounded-full border-4 border-neutral-900 z-20 flex items-center justify-center">
                   <div className={`w-3 h-3 rounded-full ${spinning ? 'bg-red-500 animate-ping shadow-[0_0_15px_red]' : 'bg-neutral-800'}`} />
                </div>
              </div>

              {/* RESULT DISPLAY */}
              <div className="w-full min-h-[160px] flex items-center justify-center relative">
                {winner ? (
                  <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full">
                    <Link href={`/single/${winner.slug}`} onClick={onClose} className="flex items-center gap-5 p-5 bg-white/5 rounded-[2.3rem] border border-amber-500/20 group hover:border-amber-500/50 transition-all shadow-xl">
                      <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-2xl shrink-0 border border-white/5">
                        <Image src={winner.cover_url || '/placeholder.jpg'} alt="" fill className="object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] font-black bg-amber-500 text-black px-2.5 py-1 rounded-full uppercase tracking-tighter mb-1.5 inline-block">Pick of the day</span>
                        <h3 className="font-bold text-white text-lg truncate group-hover:text-amber-400 transition-colors">{winner.title}</h3>
                        <p className="text-neutral-500 text-xs truncate uppercase tracking-widest italic">{winner.artist}</p>
                      </div>
                      <HiChevronRight className="ml-auto text-neutral-700 group-hover:text-white" size={28} />
                    </Link>
                  </motion.div>
                ) : (
                  <div className="text-center">
                    <p className="text-neutral-500 text-sm font-medium italic tracking-wide">
                      {spinning ? "Processing your daily track discover..." : "Engage the wheel to discover a track to listen."}
                    </p>
                  </div>
                )}
              </div>

              {/* ACTION BUTTON */}
              {!winner && (
                <button
                  onClick={handleSpin}
                  disabled={spinning || songs.length === 0}
                  className="mt-8 w-full py-5 rounded-3xl bg-white text-black font-black uppercase tracking-[0.3em] text-[10px] hover:bg-red-600 hover:text-white transition-all active:scale-95 disabled:opacity-30 shadow-2xl shadow-white/5"
                >
                  {spinning ? 'Raaja Spinning...' : 'Spin'}
                </button>
              )}

              {/* RESET / SPIN AGAIN */}
              {winner && (
                <button 
                  onClick={handleSpin} 
                  className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white transition-colors"
                >
                  <HiRefresh className={spinning ? 'animate-spin' : ''} /> Re Spin
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}