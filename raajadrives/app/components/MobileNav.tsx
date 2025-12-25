'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { HiHome, HiFolder, HiMusicNote, HiSearch, HiX } from 'react-icons/hi';
import { supabase } from '@/app/lib/supabase'; // Ensure this path is correct

interface SearchResult {
  id: string;
  title: string;
  artist: string;
  slug: string;
  type: string;
  cover_url: string | null;
}

export default function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Live Search Logic
  useEffect(() => {
    if (!isSearchOpen) return;

    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      const { data, error } = await supabase
        .from('releases')
        .select('id, title, artist, slug, type, cover_url')
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
    }
  };

  return (
    <>
      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 animate-in fade-in duration-200 overflow-y-auto">
          <div className="p-4 flex flex-col gap-6 min-h-full">
            <div className="flex justify-between items-center">
              <h2 className="text-white font-bold text-xl uppercase tracking-tight">Search</h2>
              <button onClick={() => setIsSearchOpen(false)} className="p-2 text-neutral-400">
                <HiX size={28} />
              </button>
            </div>
            
            <form onSubmit={handleSearchSubmit}>
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search albums, artists..."
                className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-red-500 transition-colors"
              />
            </form>

            {/* Live Results List */}
            <div className="flex flex-col gap-2">
              {isLoading && <p className="text-neutral-500 text-sm animate-pulse">Searching...</p>}
              
              {results.map((album) => {
                let prefix = '/flac';
                if (album.type === 'lprip') prefix = '/lprips';
                if (album.type === 'cdrip') prefix = '/cdrips';

                return (
                  <Link 
                    key={album.id} 
                    href={`${prefix}/${album.slug}`}
                    onClick={() => setIsSearchOpen(false)}
                    className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/5 active:bg-white/10 transition-all"
                  >
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-neutral-800 shrink-0">
                      <Image 
                        src={album.cover_url || '/images/placeholder.jpg'} 
                        alt="" fill className="object-cover" 
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-white text-sm truncate">{album.title}</h3>
                      <p className="text-xs text-neutral-400 truncate">{album.artist}</p>
                    </div>
                  </Link>
                );
              })}

              {searchQuery.length >= 2 && !isLoading && results.length === 0 && (
                <p className="text-neutral-500 text-sm">No results found.</p>
              )}

              {results.length > 0 && (
                <button 
                  onClick={handleSearchSubmit}
                  className="mt-2 text-center text-xs text-red-500 font-bold uppercase py-2"
                >
                  View all results
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav Bar */}
      <nav className="fixed bottom-0 left-0 w-full bg-neutral-950/80 backdrop-blur-lg border-t border-white/10 md:hidden z-[90] pb-safe">
        <ul className="flex justify-around items-center h-16">
          <li>
            <Link href="/" className={`flex flex-col items-center text-[10px] ${pathname === '/' ? 'text-red-500' : 'text-neutral-400'}`}>
              <HiHome size={24} />
              <span className="mt-1">Home</span>
            </Link>
          </li>
          <li>
            <Link href="/latest" className={`flex flex-col items-center text-[10px] ${pathname === '/latest' ? 'text-red-500' : 'text-neutral-400'}`}>
              <HiMusicNote size={24} />
              <span className="mt-1">Latest</span>
            </Link>
          </li>
          <li>
            <Link href="/all" className={`flex flex-col items-center text-[10px] ${pathname === '/all' ? 'text-red-500' : 'text-neutral-400'}`}>
              <HiFolder size={24} />
              <span className="mt-1">Archive</span>
            </Link>
          </li>
          <li>
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex flex-col items-center text-[10px] text-neutral-400"
            >
              <HiSearch size={24} />
              <span className="mt-1">Search</span>
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}