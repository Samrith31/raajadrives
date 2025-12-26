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
  
  // --- HIGH-LUMEN COLOR PALETTE ---
  // Using red-500 because it's more vibrant than red-600 on dark backgrounds
  const brightRed = 'text-red-500'; 
  const brightAmber = 'text-amber-400';
  
  // Intense, layered glows for that "LED" look
  const redNeon = 'drop-shadow-[0_0_10px_rgba(239,68,68,0.9)] drop-shadow-[0_0_2px_rgba(255,255,255,0.4)]';
  const amberNeon = 'drop-shadow-[0_0_10px_rgba(251,191,36,0.9)] drop-shadow-[0_0_2px_rgba(255,255,255,0.4)]';

  const handleRating = async (value: number) => {
    if (isSubmitting || hasVoted) return;
    if (window?.navigator?.vibrate) window.navigator.vibrate(10); 
    
    setIsSubmitting(true);
    const { error } = await supabase
      .from('releases')
      .update({ rating_sum: initialSum + value, rating_count: initialCount + 1 })
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
    <div className="flex flex-col items-center md:items-start select-none font-sans">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const isHovered = hover >= star;
          const isRated = star <= Math.round(Number(avgRating));
          
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
              {/* Laser Scanline (Subtle back-glow) */}
              {!hasVoted && isHovered && (
                <div className={`absolute inset-x-0 h-[2px] top-1/2 -translate-y-1/2 blur-[2px] opacity-40 animate-pulse
                  ${isFirstRating ? 'bg-red-400' : 'bg-amber-300'}`} 
                />
              )}

              {/* The Star Icon */}
              <HiStar 
                className={`w-6 h-6 transition-all duration-200 ease-out relative z-10
                  ${isHovered 
                    ? `${isFirstRating ? brightRed : brightAmber} ${isFirstRating ? redNeon : amberNeon}` 
                    : isRated 
                      ? `${brightRed} ${redNeon}` 
                      : 'text-white/10 hover:text-white/30'
                  }
                  ${hasVoted && isRated ? 'brightness-125' : ''}
                `}
              />
            </button>
          );
        })}
        
        {/* Compact Digital Score */}
        <div className="ml-4 flex items-baseline gap-1">
          <span className={`text-xl font-black font-mono tracking-tighter transition-all duration-500
            ${hasVoted ? `${brightRed} drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]` : 'text-white'}
          `}>
            {avgRating}
          </span>
          <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">/ 5.0</span>
        </div>
      </div>

      {/* Ultra-Minimalist Status */}
      <div className="mt-2 flex items-center gap-2 px-1">
        <div className={`w-[3px] h-[3px] rounded-full transition-all duration-500 
          ${hasVoted ? 'bg-red-500 shadow-[0_0_6px_#ef4444]' : 'bg-white/10 animate-pulse'}`} 
        />
        <p className={`text-[9px] uppercase tracking-[0.4em] font-black transition-colors duration-500
          ${hasVoted ? 'text-neutral-500' : hover > 0 ? (isFirstRating ? 'text-red-500' : 'text-amber-400') : 'text-neutral-700'}
        `}>
          {hasVoted ? "This Raaja Fan has Logged" : hover > 0 ? "Analyzing Signal..." : "Awaiting Data"}
        </p>
      </div>
    </div>
  );
}