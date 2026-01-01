'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '@/app/lib/supabase';
import { useAuth } from '@/app/context/AuthContext';
import { HiPlus, HiX, HiCheckCircle } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';
import CreateCrate from './CreateCrate';

interface UserCrate {
  id: string;
  title: string;
}

interface AddToCrateProps {
  releaseId: string;
  releaseTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function AddToCrateModal({ releaseId, releaseTitle, isOpen, onClose }: AddToCrateProps) {
  const { user } = useAuth();
  const [crates, setCrates] = useState<UserCrate[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchMyCrates = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('crates')
      .select('id, title')
      .eq('user_id', user.id);

    if (data) setCrates(data as UserCrate[]);
  };

  useEffect(() => {
    if (isOpen && user) {
      fetchMyCrates();
    }
  }, [isOpen, user]);

  const handleAddToCrate = async (crateId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('crate_items')
        .insert([{ crate_id: crateId, release_id: releaseId }]);

      if (error) {
        if (error.code === '23505') alert('Already in this crate!');
        else throw error;
      } else {
        setStatus('success');
        setTimeout(() => {
          setStatus('idle');
          onClose();
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-gradient-to-br from-black/95 to-neutral-900/90" 
            />

            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 30 }}
              className="relative w-full max-w-sm sm:max-w-md bg-gradient-to-b from-neutral-900/95 to-black/90 border border-neutral-700/60 rounded-2xl sm:rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-[0_25px_75px_rgba(0,0,0,0.9)] mx-2"
            >
              {/* CRATE LOGO */}
              <div className="mb-8 text-center pt-2">
                <div className="relative mx-auto mb-6">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-black/95 to-neutral-900/80 border-4 border-neutral-700 shadow-[0_0_30px_rgba(0,0,0,0.8)] relative overflow-hidden mx-auto">
                    <div className="absolute inset-0 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500/90 to-red-600/90 border-3 border-white/40 shadow-[0_0_25px_rgba(255,165,0,0.6)]">
                      <Image 
                        src="/images/crate-logo.jpeg"
                        alt="Crate Logo"
                        width={96}
                        height={96}
                        className="w-4/5 h-4/5 object-contain rounded-full"
                        priority
                      />
                    </div>
                    <div className="absolute inset-0 rounded-full opacity-20 bg-[conic-gradient(from_0deg,#444_0deg,transparent_90deg)] animate-[spin_20s_linear_infinite]" />
                  </div>
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-black uppercase tracking-[-0.02em] text-white mb-2 drop-shadow-2xl italic bg-gradient-to-r from-white via-orange-400 to-red-500 bg-clip-text text-transparent">
                    Dig In Crate
                  </h3>
                  <p className="text-neutral-400 text-xs sm:text-sm uppercase tracking-[0.2em] font-mono bg-gradient-to-r from-yellow-400/80 to-orange-400/80 bg-clip-text">
                    &quot;{releaseTitle}&quot;
                  </p>
                </div>
              </div>

              {/* Close button */}
              <button 
                onClick={onClose} 
                className="absolute top-4 right-4 sm:top-6 sm:right-6 text-neutral-500 hover:text-red-400 p-2 rounded-full border border-neutral-700/50 hover:border-red-500/50 transition-all text-lg sm:text-xl"
              >
                <HiX />
              </button>

              {/* Crate list */}
              <div className="space-y-3 max-h-[60vh] overflow-y-auto mb-8 pr-2 -mr-2 sm:-mr-2">
                {crates.length > 0 ? (
                  <>
                    {crates.map((crate) => (
<motion.button
  key={crate.id}
  disabled={loading || status === 'success'}
  onClick={() => handleAddToCrate(crate.id)}
  className="group w-full flex items-center py-4 sm:py-5 px-4 sm:px-5 bg-neutral-950/70 border-2 border-white/10 rounded-xl sm:rounded-2xl shadow-sm relative overflow-hidden"
  whileHover={{ scale: 1.01 }} // tiny pop
  whileTap={{ scale: 0.98 }}
>
  {/* Crate icon */}
  <div className="mr-3 sm:mr-4 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-black to-neutral-900 border-2 border-neutral-600 group-hover:border-orange-500 flex items-center justify-center shadow-sm flex-shrink-0">
    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-orange-500 rounded-full border border-white/50 shadow-inner" />
  </div>

  <div className="flex-1 min-w-0">
    <p className="text-white font-bold uppercase tracking-tight text-xs sm:text-sm group-hover:text-orange-400 transition-colors truncate">
      {crate.title}
    </p>
  </div>

  <div className="ml-2 sm:ml-3 flex-shrink-0">
    {status === 'success' ? (
      <HiCheckCircle className="text-green-500 text-lg sm:text-xl" />
    ) : (
      <HiPlus className="text-neutral-500 group-hover:text-orange-400 text-lg sm:text-xl transition-colors" />
    )}
  </div>

  {/* Optional: subtle hover glow */}
  <div className="absolute inset-0 rounded-xl bg-white/5 opacity-0 group-hover:opacity-20 pointer-events-none transition-opacity"></div>
</motion.button>


                    ))}
                    
                    {/* Create new crate */}
                    <motion.button 
                      onClick={() => setIsCreateModalOpen(true)}
                      className="w-full py-4 sm:py-5 px-4 sm:px-5 border-2 border-dashed border-orange-500/60 rounded-xl sm:rounded-2xl text-orange-400 hover:border-orange-500 hover:bg-orange-500/10 font-bold uppercase tracking-wide text-xs sm:text-sm transition-all hover:text-orange-300 min-h-[56px] sm:min-h-[64px]"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      + Build New Crate
                    </motion.button>
                  </>
                ) : (
                  <div className="text-center py-10 sm:py-12 border-2 border-dashed border-neutral-700/50 rounded-2xl sm:rounded-3xl bg-neutral-950/50 px-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 rounded-full bg-neutral-950 border-4 border-neutral-700 shadow-xl flex items-center justify-center">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full border-2 border-white shadow-lg" />
                    </div>
                    <p className="text-neutral-500 uppercase font-bold tracking-wider text-xs sm:text-sm mb-4">
                      Crate Empty
                    </p>
                    <motion.button 
                      onClick={() => setIsCreateModalOpen(true)}
                      className="w-full px-6 py-3 sm:py-3 border-2 border-orange-500 bg-gradient-to-r from-orange-500/90 to-red-500 text-white uppercase font-bold tracking-wider text-xs sm:text-xs rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 min-h-[44px]"
                    >
                      Stack First Record
                    </motion.button>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="text-center pt-4 border-t border-neutral-800/50 px-2">
                <p className="text-xs text-neutral-500 uppercase font-mono tracking-widest">
                  Record Shop Keeper Approved
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CreateCrate 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onRefresh={fetchMyCrates} 
      />
    </>
  );
}
