'use client';

import Link from 'next/link';
import Image from 'next/image'; // 👈 Imported Image component

export default function Footer() {
  return (
    <footer className="relative bg-black pt-20 pb-10 border-t border-white/10 overflow-hidden mt-auto">
      
      {/* Background Glow Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-900/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* --- TOP SECTION: Grid Layout --- */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-20">
          
          {/* Column 1: Brand & Developer (Span 6) */}
          <div className="md:col-span-6 space-y-6">
            
            {/* 👇 BRAND LOGO + TEXT */}
            <Link href="/" className="inline-flex items-center gap-4 group">
              
              {/* Logo Icon Container */}
              <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/10 group-hover:border-red-600/50 transition-colors duration-300">
                {/* ⚠️ Ensure 'logo.png' exists in your public/images/ folder */}
                <Image
                  src="/images/logo-2.jpeg" 
                  alt="Raaja Drives Logo"
                  fill
                  unoptimized={true}
                  className="object-cover"
                />
              </div>

              {/* Brand Text */}
              <h2 className="font-display text-3xl font-bold text-white tracking-tight">
                raaja<span className="text-red-600">drives</span>.
              </h2>
            </Link>

            <p className="text-neutral-400 leading-relaxed max-w-sm">
              The definitive archive for high-fidelity audio. Preserving the legacy of Ilaiyaraaja in lossless quality.
            </p>
            
            {/* Developer Credit Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-neutral-300 mt-4 hover:bg-white/10 transition-colors cursor-default">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Built & Developed by <span className="text-white font-bold">Samrith</span>
            </div>
          </div>

          {/* Column 2: Quick Links (Span 3) */}
          <div className="md:col-span-3">
            <h3 className="text-white font-bold mb-6">Explore</h3>
            <ul className="space-y-4 text-sm text-neutral-400">
              <li><Link href="/latest" className="hover:text-red-500 transition-colors">Latest Releases</Link></li>
              <li><Link href="/flac" className="hover:text-red-500 transition-colors">Digital FLAC</Link></li>
              <li><Link href="/lprips" className="hover:text-red-500 transition-colors">Vinyl Rips</Link></li>
              <li><Link href="/cdrips" className="hover:text-red-500 transition-colors">CD Archive</Link></li>
              <li><Link href="/dmca" className="hover:text-red-500 transition-colors">DMCA</Link></li>
            </ul>
          </div>

          {/* Column 3: Socials (Span 3) */}
          <div className="md:col-span-3">
            <h3 className="text-white font-bold mb-6">Connect</h3>
            
            <div className="flex gap-4">
              
              {/* Telegram Button  https://t.me/+2eRd9A1OaAs5NTJl */}
              <Link 
                href="#" 
                target="_blank"
                className="w-12 h-12 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-[#229ED9] hover:border-[#229ED9] transition-all duration-300"
              >
                <svg className="w-5 h-5 fill-current ml-[-2px] mt-[1px]" viewBox="0 0 24 24">
                  <path d="M21.928 2.527c-.366-.826-1.536-1.053-2.155-.42L3.65 14.28c-.808.825-.262 2.227.856 2.456l3.96 1.05 1.576 4.96c.21.66 1.15.777 1.52.19l2.36-3.765 5.253 3.99c.846.643 2.08.156 2.22-1.026L24.8 3.748c.09-.76-.36-1.48-1.096-1.78zM7.94 15.968l-3.34-.886L20.87 3.65l-12.93 12.318zm4.18 5.48l-1.3-4.09 3.03 2.28-1.73 1.81z"/>
                </svg>
              </Link>

              {/* YouTube  https://youtube.com/@samrith31?si=4KLeuZ1_i-tPY_oI*/}
              <Link 
                href="#" 
                target="_blank"
                className="w-12 h-12 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-red-600 hover:border-red-600 transition-all duration-300"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.498-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </Link>

              {/* X / Twitter https://x.com/samstillyearns */}
              <Link 
                href="#" 
                target="_blank"
                className="w-12 h-12 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-black hover:border-white/40 transition-all duration-300"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </Link>
            </div>
          </div>
        </div>

        {/* --- BOTTOM SECTION: Divider & Copyright --- */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-neutral-600">
            © {new Date().getFullYear()} Raaja Drives. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-neutral-600">
            <Link href="#" className="hover:text-neutral-400 transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-neutral-400 transition-colors">Terms of Service</Link>
          </div>
        </div>

      </div>

      {/* --- GIANT WATERMARK --- */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden pointer-events-none select-none">
        <h1 className="text-[12vw] font-bold text-white/[0.02] leading-none text-center tracking-tighter translate-y-1/4">
          RAAJADRIVES
        </h1>
      </div>
      
    </footer>
  );
}