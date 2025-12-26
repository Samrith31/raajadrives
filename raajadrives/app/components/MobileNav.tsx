'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { HiHome, HiFolder, HiMusicNote, HiSearch, HiX } from 'react-icons/hi';
import { supabase } from '@/app/lib/supabase';

interface SearchResult {
  id: string;
  title: string;
  artist: string;
  slug: string;
  type: string;
  cover_url: string | null;
  is_single: boolean; // Added is_single flag
}

export default function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isSearchOpen) return;

    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      // 1. Updated Select to include is_single
      const { data, error } = await supabase
        .from('releases')
        .select('id, title, artist, slug, type, cover_url, is_single')
        .or(`title.ilike.%${searchQuery}%,artist.ilike.%${searchQuery}%`)
        .limit(5);

      if (!error && data) {
        setResults(data as SearchResult[]);
      }
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, isSearchOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <>
      {/* Search Overlay with Smooth Entrance */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl animate-in fade-in duration-300 overflow-y-auto">
          <div className="p-6 flex flex-col gap-6 min-h-full">
            <div className="flex justify-between items-center animate-in slide-in-from-top-4 duration-500">
              <h2 className="text-white font-bold text-2xl tracking-tighter uppercase italic">Search</h2>
              <button 
                onClick={() => setIsSearchOpen(false)} 
                className="p-2 text-neutral-400 active:scale-75 transition-transform"
              >
                <HiX size={32} />
              </button>
            </div>
            
            <form onSubmit={handleSearchSubmit} className="animate-in slide-in-from-bottom-2 duration-500">
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search songs, albums..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white text-lg focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 transition-all shadow-2xl"
              />
            </form>

            {/* Results with Staggered Fade-in */}
            <div className="flex flex-col gap-3">
              {isLoading && <p className="text-red-500 text-sm animate-pulse font-medium">Scanning archive...</p>}
              
              {results.map((album, index) => {
                // --- 2. UPDATED DYNAMIC ROUTING LOGIC ---
                let prefix = '/flac';
                if (album.is_single) {
                  prefix = '/single'; // Priority route
                } else if (album.type === 'lprip') {
                  prefix = '/lprips';
                } else if (album.type === 'cdrip') {
                  prefix = '/cdrips';
                }

                return (
                  <Link 
                    key={album.id} 
                    href={`${prefix}/${album.slug}`}
                    onClick={() => setIsSearchOpen(false)}
                    style={{ animationDelay: `${index * 50}ms` }}
                    className="flex items-center gap-4 p-3 bg-white/5 rounded-2xl border border-white/5 active:scale-[0.98] active:bg-white/10 transition-all animate-in fade-in slide-in-from-bottom-3 duration-500"
                  >
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-neutral-800 shrink-0 shadow-lg border border-white/5">
                      <Image 
                        src={album.cover_url || '/images/placeholder.jpg'} 
                        alt="" fill className="object-cover" 
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-base truncate">{album.title}</h3>
                        {/* 3. NEW: Subtle Mobile Indicator for Single */}
                        {album.is_single && (
                          <span className="text-[8px] font-black bg-amber-500 text-black px-1.5 rounded uppercase tracking-tighter">
                            Single
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-400 truncate uppercase tracking-widest">{album.artist}</p>
                    </div>
                  </Link>
                );
              })}

              {searchQuery.length >= 2 && !isLoading && results.length === 0 && (
                <p className="text-neutral-500 text-sm text-center py-10">No matches found in the archive.</p>
              )}

              {results.length > 0 && (
                <button 
                  onClick={handleSearchSubmit}
                  className="mt-4 text-center text-xs text-red-500 font-black uppercase py-4 border border-red-500/20 rounded-xl bg-red-500/5 active:scale-95 transition-transform"
                >
                  Show all results for &quot;{searchQuery}&quot;
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom Nav Bar */}
      <nav className="fixed bottom-0 left-0 w-full bg-neutral-950/90 backdrop-blur-2xl border-t border-white/5 md:hidden z-[90] pb-safe">
        <ul className="flex justify-around items-center h-20">
          {[
            { label: 'Home', href: '/', icon: <HiHome size={26} /> },
            { label: 'Latest', href: '/latest', icon: <HiMusicNote size={26} /> },
            { label: 'Archive', href: '/all', icon: <HiFolder size={26} /> },
          ].map((item) => (
            <li key={item.href}>
              <Link 
                href={item.href} 
                className={`flex flex-col items-center gap-1 transition-all duration-300 active:scale-75 ${
                  pathname === item.href ? 'text-red-500' : 'text-neutral-500'
                }`}
              >
                <div className={`${pathname === item.href ? 'drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : ''}`}>
                  {item.icon}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
              </Link>
            </li>
          ))}
          
          <li>
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex flex-col items-center gap-1 text-neutral-500 active:scale-75 transition-all"
            >
              <HiSearch size={26} />
              <span className="text-[10px] font-bold uppercase tracking-tighter">Search</span>
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}