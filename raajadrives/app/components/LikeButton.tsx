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
}

export default function LikeButton({ releaseId, variant = 'pill' }: LikeButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Like Data
  useEffect(() => {
    const fetchLikeStatus = async () => {
      // Fetch total count
      const { count: total } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('release_id', releaseId);
      
      setCount(total || 0);

      // Check if current user liked it
      if (user) {
        const { data } = await supabase
          .from('likes')
          .select('id')
          .eq('release_id', releaseId)
          .eq('user_id', user.id)
          .maybeSingle();
        
        setIsLiked(!!data);
      }
      setLoading(false);
    };

    fetchLikeStatus();
  }, [releaseId, user]);

  // 2. Toggle Logic
  const toggleLike = async (e?: React.MouseEvent) => {
    // Prevent event bubbling if used inside a Link/Card
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!user) return router.push('/login');
    if (loading) return;

    if (navigator.vibrate) navigator.vibrate(10);

    const previousState = isLiked;
    const previousCount = count;
    
    // Optimistic Update
    setIsLiked(!isLiked);
    setCount(isLiked ? count - 1 : count + 1);

    if (previousState) {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('release_id', releaseId)
        .eq('user_id', user.id);
      
      if (error) {
        setIsLiked(previousState);
        setCount(previousCount);
      }
    } else {
      const { error } = await supabase
        .from('likes')
        .insert({ release_id: releaseId, user_id: user.id });
      
      if (error) {
        setIsLiked(previousState);
        setCount(previousCount);
      }
    }
  };

  // --- UI VARIANTS ---

  // CIRCLE VARIANT (For Album Cards)
  if (variant === 'circle') {
    return (
      <button 
        onClick={toggleLike}
        className="relative z-40 p-2 md:p-2.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 hover:bg-white hover:text-black transition-all active:scale-90 flex items-center justify-center"
      >
        <motion.div
          key={isLiked ? 'liked' : 'unliked'}
          animate={isLiked ? { scale: [1, 1.4, 1] } : { scale: 1 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
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

  // PILL VARIANT (For Album/Single Pages)
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
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            {isLiked ? (
              <HiHeart 
                className="text-red-600 drop-shadow-[0_0_10px_rgba(220,38,38,0.6)]" 
                size={20} 
              />
            ) : (
              <HiOutlineHeart 
                className="text-neutral-500 group-hover:text-red-500 transition-colors" 
                size={20} 
              />
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