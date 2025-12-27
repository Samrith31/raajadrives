'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import RouletteModal from './RouletteModal'; // Ensure correct import path

const heroSlides = [
  {
    id: 1,
    image: '/images/raaja-1.avif',
    badge: "The Maestro's Touch",
    quote: "Music flows through me like a river; I am merely the vessel.",
    subQuote: "Defining the sound of South Indian Cinema since 1976."
  },
  {
    id: 2,
    image: '/images/raaja-2.jpg',
    badge: "Analog Warmth",
    quote: "True emotion cannot be synthesized. It must be captured.",
    subQuote: "Experience his golden era in pure, uncompressed analog rips."
  },
  {
    id: 3,
    image: '/images/raaja-3.webp',
    badge: "Timeless Legacy",
    quote: "&quot;Where words fail, my music speaks.&quot;",
    subQuote: "Preserving the cultural heritage of Tamil music."
  },
  {
    id: 4,
    image: '/images/raaja-4.jpeg',
    badge: "Pure Sound",
    quote: "Music is nothing but sound. There is no place for value judgment.",
    subQuote: "Embracing the purity of every frequency."
  },
  {
    id: 5,
    image: '/images/raaja-5.jpeg', 
    badge: "Destiny",
    quote: "Music is my <span class='text-red-500'>fate</span>.",
    subQuote: "A lifelong journey of symphonic discovery."
  },
  {
    id: 6,
    image: '/images/raaja-6.jpeg', 
    badge: "Universal Harmony",
    quote: "There is no difference between the howl of a dog and the songs of vidwans.",
    subQuote: "Finding melody in the most unexpected places."
  }
];

export default function HeroSlideshow() {
  const [current, setCurrent] = useState(0);
  const [isRouletteOpen, setIsRouletteOpen] = useState(false); // Modal State
  const duration = 6000;

  useEffect(() => {
    const timer = setInterval(() => {
      // Don't auto-slide if the roulette is open (optional, keeps focus)
      if (!isRouletteOpen) {
        setCurrent((prev) => (prev === heroSlides.length - 1 ? 0 : prev + 1));
      }
    }, duration);
    return () => clearInterval(timer);
  }, [isRouletteOpen]);

  return (
    <>
      <div 
        className="relative h-[80vh] w-full overflow-hidden bg-neutral-950 border-b border-white/10 group cursor-pointer"
        onClick={() => setIsRouletteOpen(true)} // Trigger Modal on Click
      >
        
        {/* --- LAYER 1: THE IMAGES --- */}
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1500 ease-in-out ${
              index === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <Image
              src={slide.image}
              alt="Ilaiyaraaja"
              fill
              className={`object-cover object-top ${index === current ? 'animate-ken-burns' : ''}`}
              priority={index === 0}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-neutral-950/30" />
            <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-transparent to-transparent" />
          </div>
        ))}


        {/* --- LAYER 2: THE CONTENT --- */}
        <div className="relative z-20 flex flex-col justify-end h-full max-w-7xl mx-auto px-6 pb-24 pointer-events-none">
          {/* pointer-events-none ensures clicking the text still triggers the parent div's onClick */}
          <div key={current} className="max-w-4xl space-y-6">
            
            <div className="animate-fade-up opacity-0" style={{ animationDelay: '200ms' }}>
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/30 bg-red-950/30 backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-xs font-bold text-red-400 tracking-widest uppercase">
                  {heroSlides[current].badge}
                </span>
              </div>
            </div>

            <h1 
              className="animate-fade-up opacity-0 font-display text-4xl md:text-6xl font-bold leading-[1.1] text-white"
              style={{ animationDelay: '400ms' }}
              dangerouslySetInnerHTML={{ __html: heroSlides[current].quote }} 
            />
            
            <p 
              className="animate-fade-up opacity-0 font-ui text-lg text-neutral-300 max-w-xl border-l-2 border-red-600 pl-4 italic"
              style={{ animationDelay: '600ms' }}
            >
              {heroSlides[current].subQuote}
            </p>

            {/* Hint for the user */}
            <div className="animate-fade-up opacity-0 pt-4" style={{ animationDelay: '800ms' }}>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500 bg-red-500/10 px-4 py-2 rounded-full border border-red-500/20">
                Click to Spin for a Random Gem
              </span>
            </div>
          </div>
        </div>


        {/* --- LAYER 3: PROGRESS INDICATORS --- */}
        <div className="absolute bottom-8 left-6 z-30 flex gap-3">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation(); // Prevents the wheel from opening when just switching dots
                setCurrent(index);
              }}
              className={`h-1 rounded-full transition-all duration-500 ${
                index === current ? 'w-8 bg-red-600' : 'w-2 bg-white/30 hover:bg-white'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
        
        <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-neutral-950 to-transparent z-20" />
      </div>

      {/* --- THE MODAL --- */}
      <RouletteModal 
        isOpen={isRouletteOpen} 
        onClose={() => setIsRouletteOpen(false)} 
      />
    </>
  );
}