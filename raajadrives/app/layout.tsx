'use client'; // Enable client-side state

import { useEffect, useState } from 'react';
import "./global.css";
import { Inter, Space_Grotesk } from "next/font/google";
import Link from "next/link";
import SearchBar from "@/app/components/SearchBar";
import Footer from "@/app/components/footer";
import MobileNav from "@/app/components/MobileNav";
import { AuthProvider } from "@/app/context/AuthContext";
import NavbarAuth from "@/app/components/NavbarAuth";
import NotificationCenter from "@/app/components/NotificationCenter"; // ✅ Import NotificationCenter
import { HiLightningBolt, HiUsers, HiSearch, HiX } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Prevent body scroll when search overlay is open
  useEffect(() => {
    document.body.style.overflow = isSearchOpen ? 'hidden' : 'unset';
  }, [isSearchOpen]);

  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="antialiased min-h-screen bg-neutral-950 text-white selection:bg-red-600 selection:text-white overflow-x-hidden">
        <AuthProvider>
          
          {/* --- MOBILE SEARCH OVERLAY --- */}
          <AnimatePresence>
            {isSearchOpen && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed inset-0 z-[100] bg-neutral-950/95 backdrop-blur-2xl flex flex-col p-6 md:hidden"
              >
                <div className="flex justify-between items-center mb-12">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-[2px] bg-red-600" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">Global Archive</span>
                  </div>
                  <button 
                    onClick={() => setIsSearchOpen(false)}
                    className="p-3 rounded-full bg-white/5 border border-white/10 text-white"
                  >
                    <HiX size={24} />
                  </button>
                </div>
                
                <div className="w-full">
                  <SearchBar onSubmit={() => setIsSearchOpen(false)} /> 
                </div>

                <div className="mt-auto py-10 text-center">
                  <p className="text-[9px] text-neutral-700 font-bold uppercase tracking-[0.4em]">Search Raajadrives Network</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Background glow */}
          <div className="fixed inset-0 -z-10 bg-neutral-950">
            <div className="absolute -top-24 -left-24 h-[420px] w-[420px] rounded-full bg-red-900/20 blur-[100px]" />
            <div className="absolute -bottom-24 -right-24 h-[420px] w-[420px] rounded-full bg-blue-900/10 blur-[100px]" />
          </div>

          <header className="sticky top-0 z-50 border-b border-white/5 bg-neutral-950/70 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
              
              {/* Logo */}
              <Link href="/" className="group flex items-center gap-2">
                <div className="flex gap-[3px] items-end h-4">
                  <span className="w-1 h-2 bg-red-600 rounded-sm animate-pulse" />
                  <span className="w-1 h-4 bg-red-600 rounded-sm animate-pulse" />
                  <span className="w-1 h-3 bg-red-600 rounded-sm animate-pulse" />
                </div>
                <h1 className="font-display text-lg font-bold tracking-tight">
                  raaja<span className="text-red-600">drives</span>
                </h1>
              </Link>

              {/* Mobile Right Section (Search + Notifications) */}
              <div className="flex items-center gap-2 md:hidden">
                <NotificationCenter /> {/* ✅ Notifications on Mobile */}
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 rounded-full bg-white/5 border border-white/10 text-neutral-400"
                >
                  <HiSearch size={20} />
                </button>
              </div>

              {/* Desktop nav */}
              <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-400">
                <SearchBar />
                <Link href="/latest" className="hover:text-white transition-colors">Latest</Link>
                <Link href="/all" className="hover:text-white transition-colors">Archive</Link>
                <Link href="/activity" className="flex items-center gap-1.5 hover:text-red-500 transition-all group">
                  <HiLightningBolt size={18} className="text-red-600 group-hover:animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest italic">Feed</span>
                </Link>
                <Link href="/discovery" className="flex items-center gap-1.5 hover:text-red-500 transition-all group">
                  <HiUsers size={18} className="text-red-600" />
                  <span className="text-[10px] font-black uppercase tracking-widest italic">Discover</span>
                </Link>
                <NotificationCenter /> {/* ✅ Notifications on Desktop */}
                <NavbarAuth />
              </nav>
            </div>
          </header>

          <main className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8">
            {children}
          </main>

          <Footer />
          <MobileNav />
        </AuthProvider>
      </body>
    </html>
  );
}