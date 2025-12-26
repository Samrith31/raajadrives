'use client';

import { useRef } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import AlbumCard from '@/app/components/AlbumCard';
import { Release } from '@/app/data/release';

interface LatestDropsProps {
  releases: Release[];
}

export default function LatestDrops({ releases }: LatestDropsProps) {
  const scrollContainer = useRef<HTMLDivElement>(null);

  // Take the first 5 items from the real data
  const latestReleases = releases.slice(0, 5);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainer.current) {
      const { current } = scrollContainer;
      const scrollAmount = 300;
      if (direction === 'left') {
        current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  if (latestReleases.length === 0) return null;

  return (
    <section className="relative py-12 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="text-xs font-bold tracking-widest text-red-500 uppercase">
                Just Added
              </span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white">
              Latest <span className="text-neutral-500">Drops</span>
            </h2>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => scroll('left')}
              className="p-3 rounded-full border border-white/10 hover:bg-white hover:text-black transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => scroll('right')}
              className="p-3 rounded-full border border-white/10 hover:bg-white hover:text-black transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Slider */}
        <div 
          ref={scrollContainer}
          className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide -mx-6 px-6"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {latestReleases.map((release) => {
            // --- UPDATED ROUTING LOGIC ---
            // 1. Check if it's a single first (Priority)
            // 2. Fallback to format-based folders
            let folder = 'flac';
            
            if (release.isSingle || release.type === 'single') {
              folder = 'single';
            } else if (release.type === 'lprip') {
              folder = 'lprips';
            } else if (release.type === 'cdrip') {
              folder = 'cdrips';
            }

            return (
              <div key={release.id} className="min-w-[200px] md:min-w-[240px] snap-start">
                <AlbumCard 
                  album={release} 
                  href={`/${folder}/${release.slug}`} 
                />
              </div>
            );
          })}

          {/* "View All" Card */}
          <div className="min-w-[200px] md:min-w-[240px] snap-start flex items-center justify-center">
            <Link 
              href="/latest"
              className="group flex flex-col items-center gap-4 text-neutral-500 hover:text-red-500 transition-colors"
            >
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-current flex items-center justify-center group-hover:scale-110 transition-transform">
                <ArrowRight className="w-6 h-6" />
              </div>
              <span className="font-bold text-sm uppercase tracking-widest">View Archive</span>
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}