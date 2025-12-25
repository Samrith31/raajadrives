'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

const images = [
  '/images/raaja-bg-11.jpeg',
  '/images/raaja-bg-5.jpeg',
  '/images/raaja-bg-3.jpeg',
  '/images/raaja-bg-6.jpeg',
  '/images/raaja-bg-8.jpeg',
  '/images/raaja-bg-9.jpeg',
  '/images/raaja-bg-10.jpeg',
  '/images/raaja-bg-2.jpeg',
  '/images/raaja-album-cover.webp'
];

export default function BackgroundSlideshow() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 bg-black overflow-hidden pointer-events-none">
      {images.map((src, index) => (
        <div
          key={src}
          className={`absolute inset-0 transition-opacity duration-[2000ms] ease-in-out mobile-scroll-fix ${
            index === currentIndex ? 'opacity-70' : 'opacity-0'
          }`}
        >
          <Image
            src={src}
            alt="Background"
            fill
            className="object-cover object-top"
            priority={index === 0}
            /* 'sizes' tells Next.js to serve a smaller, 
                lighter image file on mobile screens */
            sizes="(max-width: 768px) 100vw, 100vw" 
            quality={60} // Lower quality for background images saves mobile data/CPU
          />
        </div>
      ))}
      
      {/* Optimization: Using a fixed overlay that doesn't re-render */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/70 to-black pointer-events-none" />
    </div>
  );
}