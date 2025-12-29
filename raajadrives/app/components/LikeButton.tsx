'use client';

import { useState, useEffect } from 'react';
import { HiHeart, HiOutlineHeart } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/app/lib/supabase';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';

interface LikeButtonProps {
  releaseId: string;
  variant?: 'pill' | 'circle';
  onLikeToggle?: (isLiked: boolean) => void; // Added for Parent Communication
}

export default function LikeButton({ releaseId, variant = 'pill', onLikeToggle }: LikeButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Like Data
  useEffect(() => {
    let active = true;
    const fetchLikeStatus = async () => {
      const { count: total } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('release_id', releaseId);
      
      if (!active) return;
      setCount(total || 0);

      if (user) {
        const { data } = await supabase
          .from('likes')
          .select('id')
          .eq('release_id', releaseId)
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (data && active) setIsLiked(true);
      }
      setLoading(false);
    };

    fetchLikeStatus();
    return () => { active = false; };
  }, [releaseId, user]);

  // 2. Toggle Logic
  const toggleLike = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!user) return router.push('/login');
    if (loading) return;

    if (navigator.vibrate) navigator.vibrate(10);

    const previousState = isLiked;
    const previousCount = count;
    const newState = !isLiked;
    
    // --- STEP 1: UI UPDATES ---
    setIsLiked(newState);
    setCount(newState ? count + 1 : count - 1);

    // --- STEP 2: NOTIFY PARENT ---
    // This unlocks the download button instantly
    if (onLikeToggle) {
      onLikeToggle(newState);
    }

    // --- STEP 3: DATABASE UPDATE ---
    if (previousState) {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('release_id', releaseId)
        .eq('user_id', user.id);
      
      if (error) {
        setIsLiked(previousState);
        setCount(previousCount);
        if (onLikeToggle) onLikeToggle(previousState);
      }
    } else {
      const { error } = await supabase
        .from('likes')
        .insert({ release_id: releaseId, user_id: user.id });
      
      if (error) {
        setIsLiked(previousState);
        setCount(previousCount);
        if (onLikeToggle) onLikeToggle(previousState);
      }
    }
  };

  // --- UI RENDERING ---
  if (variant === 'circle') {
    return (
      <button 
        onClick={toggleLike}
        className="relative z-40 p-2 md:p-2.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 hover:bg-white hover:text-black transition-all active:scale-90 flex items-center justify-center"
      >
        <motion.div
          key={isLiked ? 'liked' : 'unliked'}
          animate={isLiked ? { scale: [1, 1.4, 1] } : { scale: 1 }}
        >
          {isLiked ? (
            <HiHeart className="text-red-500 text-lg md:text-xl" />
          ) : (
            <HiOutlineHeart className="text-white text-lg md:text-xl" />
          )}
        </motion.div>
      </button>
    );
  }

  return (
    <button
      onClick={toggleLike}
      className="group flex items-center gap-2.5 px-5 py-2 rounded-full bg-white/5 border border-white/10 hover:border-red-500/40 hover:bg-white/[0.07] transition-all active:scale-95 select-none"
    >
      <div className="relative flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={isLiked ? 'liked' : 'unliked'}
            initial={{ scale: 1 }}
            animate={isLiked ? { 
              scale: [1, 1.4, 1],
              rotate: [0, 15, -15, 0] 
            } : { scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            {isLiked ? (
              <HiHeart className="text-red-600 drop-shadow-[0_0_10px_rgba(220,38,38,0.6)]" size={20} />
            ) : (
              <HiOutlineHeart className="text-neutral-500 group-hover:text-red-500 transition-colors" size={20} />
            )}
          </motion.div>
        </AnimatePresence>

        {isLiked && (
          <motion.span
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, 1, 0], y: -20 }}
            transition={{ duration: 0.6 }}
            className="absolute text-[10px] font-black text-red-500 pointer-events-none"
          >
            +1
          </motion.span>
        )}
      </div>

      <span className={`text-[11px] font-black font-mono tabular-nums tracking-tighter transition-colors duration-300 ${
        isLiked ? 'text-white' : 'text-neutral-500'
      }`}>
        {count}
      </span>
    </button>
  );
}