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

  const handleRating = async (value: number) => {
    if (isSubmitting || hasVoted) return;
    
    // Add a tiny vibration for haptic feedback if supported
    if (window.navigator.vibrate) window.navigator.vibrate(10);
    
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
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFull = star <= (hover || Math.round(Number(avgRating)));
          
          return (
            <button
              key={star}
              type="button"
              disabled={isSubmitting || hasVoted}
              className={`relative group/star p-1.5 transition-all duration-300 
                ${hasVoted ? 'cursor-default' : 'hover:-translate-y-1.5 active:scale-75'}`}
              onClick={() => handleRating(star)}
              onMouseEnter={() => !hasVoted && setHover(star)}
              onMouseLeave={() => setHover(0)}
            >
              {/* Star Base/Outline - High Visibility */}
              <div className={`absolute inset-0 rounded-full border transition-all duration-500
                ${!hasVoted ? 'border-white/10 group-hover/star:border-red-500/50' : 'border-transparent'}
                ${hover >= star ? 'bg-red-600/10 scale-110' : 'scale-100'}
              `} />

              {/* The Actual Star Icon */}
              <HiStar 
                className={`w-7 h-7 transition-all duration-500 ease-out relative z-10
                  ${isFull 
                    ? 'text-red-600 scale-110 drop-shadow-[0_0_15px_rgba(220,38,38,1)]' 
                    : 'text-white/20 scale-100 group-hover/star:text-white/40' // Enhanced visibility here
                  }
                  ${hasVoted && star <= Math.round(Number(avgRating)) ? 'text-red-500/40 brightness-125' : ''}
                `}
              />

              {/* Glowing Dot beneath star */}
              {!hasVoted && hover === star && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-red-500 rounded-full blur-[2px] animate-pulse" />
              )}
            </button>
          );
        })}
        
        {/* Score Badge */}
        <div className={`ml-4 px-4 py-1.5 rounded-lg border transition-all duration-700 font-mono shadow-2xl
          ${hasVoted ? 'border-red-500/40 bg-red-950/20' : 'border-white/10 bg-white/5'}
        `}>
          <span className="text-xl font-black italic tracking-tighter text-white">
            {avgRating}
          </span>
        </div>
      </div>

      {/* Dynamic Status Text */}
      <div className="h-4 mt-3 flex flex-col items-center md:items-start overflow-hidden">
        <p className={`text-[10px] uppercase tracking-[0.3em] font-bold transition-all duration-500
          ${!hasVoted ? 'text-neutral-500 opacity-100' : '-translate-y-full opacity-0'}
        `}>
          {hover > 0 ? <span className="text-red-500 animate-pulse">How much you liked ?</span> : "Awaiting Rating"}
        </p>
        <p className={`text-[10px] uppercase tracking-[0.3em] font-bold text-red-500/80 transition-all duration-500
          ${hasVoted ? '-translate-y-full opacity-100' : 'opacity-0'}
        `}>
          This Raaja Fan has logged.
        </p>
      </div>
    </div>
  );
}