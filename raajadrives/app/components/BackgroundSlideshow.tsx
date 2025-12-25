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
    <div className="fixed inset-0 -z-10 bg-black overflow-hidden">
      {images.map((src, index) => (
        <div
          key={src}
          className={`absolute inset-0 transition-opacity duration-[2000ms] ease-in-out ${
            index === currentIndex ? 'opacity-70' : 'opacity-0'
          }`}
        >
          <Image
            src={src}
            alt="Background"
            fill
            /* MODIFIED LINE BELOW:
               animate-none: Disables animation on small screens (mobile)
               md:animate-slow-zoom: Enables the zoom only on screens >= 768px 
            */
            className="object-cover object-top animate-none md:animate-slow-zoom"
            priority={index === 0}
          />
        </div>
      ))}
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/70 to-black" />
    </div>
  );
}