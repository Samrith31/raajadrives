'use client';

import { useState, useEffect } from 'react';
import { HiStar } from 'react-icons/hi';
import { supabase } from '@/app/lib/supabase';

interface StarRatingProps {
  albumId: string;
  initialSum: number;
  initialCount: number;
}

export default function StarRating({ albumId, initialSum, initialCount }: StarRatingProps) {
  const [sessionVotes, setSessionVotes] = useState(0);
  const [sessionSum, setSessionSum] = useState(0);
  const [hover, setHover] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const voted = localStorage.getItem(`voted_${albumId}`);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (voted) setHasVoted(true);
    }
  }, [albumId]);

  const totalCount = initialCount + sessionVotes;
  const totalSum = initialSum + sessionSum;
  const avgRating = totalCount > 0 ? (totalSum / totalCount).toFixed(1) : "0.0";

  const isFirstRating = initialCount === 0;
  
  // --- HIGH LUMEN COLOR PALETTE ---
  const staticRed = 'text-red-500'; // Brighter red
  const staticGlow = 'drop-shadow-[0_0_15px_rgba(239,68,68,0.9)]';

  const hoverColor = isFirstRating ? 'text-red-400' : 'text-amber-300'; // Vibrant colors
  const hoverGlow = isFirstRating ? 'bg-red-500/30' : 'bg-amber-400/30';
  const hoverShadow = isFirstRating 
    ? 'drop-shadow-[0_0_25px_rgba(239,68,68,1)]' 
    : 'drop-shadow-[0_0_25px_rgba(252,211,77,1)]';

  const handleRating = async (value: number) => {
    if (isSubmitting || hasVoted) return;
    if (window?.navigator?.vibrate) window.navigator.vibrate([10, 30, 10]);
    
    setIsSubmitting(true);
    const { error } = await supabase
      .from('releases')
      .update({ 
        rating_sum: initialSum + value, 
        rating_count: initialCount + 1 
      })
      .eq('id', albumId);

    if (!error) {
      setSessionSum(value);
      setSessionVotes(1);
      setHasVoted(true);
      localStorage.setItem(`voted_${albumId}`, 'true');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col items-center md:items-start group/container select-none">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isHovered = hover >= star;
          const isRated = star <= Math.round(Number(avgRating));
          
          return (
            <button
              key={star}
              type="button"
              disabled={isSubmitting || hasVoted}
              className={`relative group/star p-2 transition-all duration-500 
                ${hasVoted ? 'cursor-default' : 'hover:-translate-y-2 active:scale-50'}`}
              onClick={() => handleRating(star)}
              onMouseEnter={() => !hasVoted && setHover(star)}
              onMouseLeave={() => setHover(0)}
            >
              {/* Outer Neon Ring (Always slightly visible) */}
              <div className={`absolute inset-0 rounded-full border transition-all duration-700
                ${!hasVoted 
                  ? `border-white/20 blur-[1px] ${isFirstRating ? 'group-hover/star:border-red-400' : 'group-hover/star:border-amber-300'}` 
                  : 'border-transparent'}
                ${isHovered ? `${hoverGlow} scale-125 opacity-100` : 'scale-90 opacity-40'}
              `} />

              {/* The Star Icon */}
              <HiStar 
                className={`w-8 h-8 transition-all duration-300 ease-out relative z-10
                  ${isHovered 
                    ? `${hoverColor} scale-125 ${hoverShadow}` 
                    : isRated 
                      ? `${staticRed} ${staticGlow}` 
                      : 'text-white/40 scale-100 group-hover/star:text-white/80'
                  }
                  ${hasVoted && isRated ? 'brightness-150 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]' : ''}
                `}
              />

              {/* Laser Line Pulse */}
              {!hasVoted && hover === star && (
                <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-[2px] blur-[1px] animate-pulse
                  ${isFirstRating ? 'bg-red-500' : 'bg-amber-300'}`} 
                />
              )}
            </button>
          );
        })}
        
        {/* Neon Score Badge */}
        <div className={`ml-6 px-5 py-2 rounded-xl border-2 transition-all duration-1000 font-mono shadow-[0_0_30px_rgba(0,0,0,0.5)]
          ${hasVoted 
            ? 'border-red-500/50 bg-red-950/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
            : isFirstRating ? 'border-red-500/30 bg-white/5' : 'border-amber-400/30 bg-white/5'}
        `}>
          <span className={`text-2xl font-black italic tracking-tighter transition-colors duration-500
            ${hasVoted ? 'text-red-400' : 'text-white'}
          `}>
            {avgRating}
          </span>
        </div>
      </div>

      {/* Futuristic Status Bar */}
      <div className="mt-4 flex items-center gap-3">
        <div className={`w-1.5 h-1.5 rounded-full ${hasVoted ? 'bg-red-500 shadow-[0_0_8px_red]' : 'bg-white/20 animate-pulse'}`} />
        <div className="h-5 overflow-hidden">
          <div className={`transition-all duration-700 transform ${hasVoted ? '-translate-y-full' : 'translate-y-0'}`}>
             <p className={`text-[11px] uppercase tracking-[0.4em] font-black ${hover > 0 ? (isFirstRating ? 'text-red-400' : 'text-amber-300') : 'text-neutral-500'}`}>
              {hover > 0 
                ? (isFirstRating ? "Love this ?" : "Yeah Banger") 
                : "Awaiting Rating"}
            </p>
          </div>
          <div className={`transition-all duration-700 transform ${hasVoted ? '-translate-y-full opacity-100' : 'opacity-0'}`}>
            <p className="text-[11px] uppercase tracking-[0.4em] font-black text-red-500">
              This Raaja Fan Logged 
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}