'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { HiHome, HiMusicNote, HiSearch, HiX, HiUserCircle } from 'react-icons/hi'; // Added HiUserCircle
import { supabase } from '@/app/lib/supabase';
import { useAuth } from '@/app/context/AuthContext'; // Import your Auth context

interface SearchResult {
  id: string;
  title: string;
  artist: string;
  slug: string;
  type: string;
  cover_url: string | null;
  is_single: boolean;
}

export default function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth(); // Get logged in user
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  // Fetch username for the profile link
  useEffect(() => {
    if (user) {
      const getProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();
        if (data) setUsername(data.username);
      };
      getProfile();
    }
  }, [user]);

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
      {/* Search Overlay Logic remains the same ... */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl animate-in fade-in duration-300 overflow-y-auto">
           {/* ... existing search UI code ... */}
           <div className="p-6 flex flex-col gap-6 min-h-full">
            <div className="flex justify-between items-center">
              <h2 className="text-white font-bold text-2xl tracking-tighter uppercase italic">Search</h2>
              <button onClick={() => setIsSearchOpen(false)} className="p-2 text-neutral-400"><HiX size={32} /></button>
            </div>
            <form onSubmit={handleSearchSubmit}>
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search archive..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white focus:border-red-500 transition-all"
              />
            </form>
            <div className="flex flex-col gap-3">
              {results.map((album) => (
                <Link 
                   key={album.id} 
                   href={`/${album.is_single ? 'single' : 'flac'}/${album.slug}`} 
                   onClick={() => setIsSearchOpen(false)}
                   className="flex items-center gap-4 p-3 bg-white/5 rounded-2xl border border-white/5"
                >
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                    <Image src={album.cover_url || '/images/logo-2.jpeg'} alt="" fill className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-white text-sm truncate">{album.title}</h3>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest">{album.artist}</p>
                  </div>
                </Link>
              ))}
            </div>
           </div>
        </div>
      )}

      {/* --- UPDATED MOBILE NAV BAR --- */}
      <nav className="fixed bottom-0 left-0 w-full bg-neutral-950/90 backdrop-blur-2xl border-t border-white/5 md:hidden z-[90] pb-safe">
        <ul className="flex justify-around items-center h-20">
          {[
            { label: 'Home', href: '/', icon: <HiHome size={24} /> },
            { label: 'Latest', href: '/latest', icon: <HiMusicNote size={24} /> },
            // Profile Link: Dynamically routes to /profile/[username] or /login
            { 
                label: 'Archive', 
                href: user && username ? `/profile/${username}` : '/login', 
                icon: <HiUserCircle size={24} /> 
            },
          ].map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link 
                  href={item.href} 
                  className={`flex flex-col items-center gap-1 transition-all duration-300 active:scale-75 ${
                    isActive ? 'text-red-500' : 'text-neutral-500'
                  }`}
                >
                  <div className={`${isActive ? 'drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : ''}`}>
                    {item.icon}
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest leading-none">
                    {item.label === 'Archive' && user ? 'Vault' : item.label}
                  </span>
                </Link>
              </li>
            );
          })}
          
          {/* Persistent Search Button */}
          <li>
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex flex-col items-center gap-1 text-neutral-500 active:scale-75 transition-all"
            >
              <HiSearch size={24} />
              <span className="text-[9px] font-black uppercase tracking-widest leading-none">Search</span>
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}