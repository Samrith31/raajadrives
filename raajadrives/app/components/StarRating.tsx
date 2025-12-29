'use client';

import { useState, useEffect } from 'react';
import { HiStar } from 'react-icons/hi';
import { supabase } from '@/app/lib/supabase';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';

interface StarRatingProps {
  albumId: string;
  onRate?: (rating: number) => void; // ✅ Added to talk to SinglePage
}

export default function StarRating({ albumId, onRate }: StarRatingProps) {
  const { user } = useAuth();
  const router = useRouter();

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  // 1️⃣ Fetch existing rating
 // 1️⃣ Fetch existing rating
  useEffect(() => {
    // 1. If no user, stop immediately
    if (!user) return;
    
    let active = true;

    const fetchUserRating = async () => {
      const { data, error } = await supabase
        .from('ratings')
        .select('score')
        .eq('user_id', user.id)
        .eq('release_id', albumId)
        .maybeSingle();

      // 2. Only update if the component is still mounted
      if (!error && data && active) {
        setRating(data.score);
        setHasVoted(true);
        
        // 3. Notify parent if the function exists
        if (onRate) {
          onRate(data.score);
        }
      }
    };

    fetchUserRating();

    return () => { 
      active = false; 
    };
    
    // ✅ REMOVED 'onRate' from here to keep the array size constant
  }, [user, albumId]);

  // 2️⃣ Submit rating
  const handleRating = async (value: number) => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (isSubmitting || hasVoted) return;

    if (navigator?.vibrate) navigator.vibrate(10);

    setIsSubmitting(true);

    const { error } = await supabase
      .from('ratings')
      .upsert({ // Changed to upsert to prevent unique constraint errors
        user_id: user.id,
        release_id: albumId,
        score: value          
      });

    if (!error) {
      setRating(value);
      setHasVoted(true);
      
      // ✅ CRITICAL: Notify parent to unlock download
      if (onRate) {
        onRate(value);
      }
    } else {
      console.error('Rating Error:', error.message);
    }

    setIsSubmitting(false);
  };

  const brightRed = 'text-red-500';
  const brightAmber = 'text-amber-400';
  const redNeon = 'drop-shadow-[0_0_10px_rgba(239,68,68,0.9)] drop-shadow-[0_0_2px_rgba(255,255,255,0.4)]';
  const amberNeon = 'drop-shadow-[0_0_10px_rgba(251,191,36,0.9)] drop-shadow-[0_0_2px_rgba(255,255,255,0.4)]';

  return (
    <div className="flex flex-col items-center justify-center select-none font-sans w-full">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const isHovered = hover >= star;
          const isSelected = star <= (hover || rating);

          return (
            <button
              key={star}
              type="button"
              disabled={isSubmitting || hasVoted}
              className={`relative p-1.5 transition-all duration-300 
                ${hasVoted ? 'cursor-default' : 'hover:scale-125 active:scale-75'}`}
              onClick={() => handleRating(star)}
              onMouseEnter={() => !hasVoted && setHover(star)}
              onMouseLeave={() => setHover(0)}
            >
              {!hasVoted && isHovered && (
                <div className="absolute inset-x-0 h-[2px] top-1/2 -translate-y-1/2 blur-[2px] opacity-40 animate-pulse bg-amber-300" />
              )}

              <HiStar
                className={`w-7 h-7 transition-all duration-200 ease-out relative z-10
                  ${
                    isSelected
                      ? `${hasVoted ? brightRed : brightAmber} ${
                          hasVoted ? redNeon : amberNeon
                        }`
                      : 'text-white/10 hover:text-white/30'
                  }
                  ${hasVoted && isSelected ? 'brightness-125' : ''}
                `}
              />
            </button>
          );
        })}

        <div className="ml-5 flex items-baseline">
          <span
            className={`text-3xl font-black font-mono tracking-tighter transition-all duration-500
              ${
                hasVoted
                  ? `${brightRed} drop-shadow-[0_0_12px_rgba(239,68,68,0.6)]`
                  : 'text-white/20'
              }`}
          >
            {rating > 0 ? Math.floor(rating) : '0'}
          </span>

          <span 
            className={`text-2xl font-black tracking-tighter italic transition-colors duration-500 ml-0.5
              ${hasVoted ? 'text-red-900/40' : 'text-neutral-800'}`}
          >
            /5
          </span>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-center gap-2 px-1">
        <div
          className={`w-[3px] h-[3px] rounded-full transition-all duration-500 
            ${
              hasVoted
                ? 'bg-red-500 shadow-[0_0_6px_#ef4444]'
                : 'bg-white/10 animate-pulse'
            }`}
        />
        <p
          className={`text-[9px] uppercase tracking-[0.4em] font-black transition-colors duration-500
            ${
              hasVoted
                ? 'text-neutral-500'
                : hover > 0
                ? 'text-amber-400'
                : 'text-neutral-400'
            }`}
        >
          {hasVoted ? 'Rating Logged to Vault' : hover > 0 ? 'Setting Value...' : 'Rate this Release'}
        </p>
      </div>
    </div>
  );
}