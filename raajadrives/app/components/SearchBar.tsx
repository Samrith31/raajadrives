'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';

interface SearchResult {
  id: string;
  title: string;
  artist: string;
  slug: string;
  type: string;
  cover_url: string | null;
}

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 👇 FIX: Everything is now inside the timeout to avoid "Synchronous setState" error
    const delayDebounceFn = setTimeout(async () => {
      
      // 1. If query is too short, just clear results and stop
      if (query.length < 2) {
        setResults([]);
        return; 
      }

      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('releases')
        .select('id, title, artist, slug, type, cover_url')
        .or(`title.ilike.%${query}%,artist.ilike.%${query}%`)
        .limit(5);

      if (error) {
        console.error('Search error:', error);
        setResults([]);
      } else {
        setResults((data as SearchResult[]) || []);
      }
      
      setIsLoading(false);
      setShowDropdown(true);
    }, 300); // 300ms delay

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // Handle clicks outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowDropdown(false);
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div ref={searchRef} className="relative group z-50">
      
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          placeholder="Search..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            // Don't show dropdown immediately if empty, let the effect handle it
            if (e.target.value.length >= 2) setShowDropdown(true);
          }}
          className="bg-white/5 text-sm text-white placeholder-neutral-500 border border-white/5 rounded-full pl-10 pr-4 py-1.5 focus:outline-none focus:bg-white/10 focus:border-white/20 focus:w-72 w-48 transition-all duration-300"
        />
        <svg
          className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isLoading ? 'text-red-500 animate-pulse' : 'text-neutral-500 group-focus-within:text-white'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </form>

      {/* Dropdown Results */}
      {showDropdown && results.length > 0 && (
        <div className="absolute top-full right-0 mt-3 w-80 bg-neutral-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {isLoading ? (
            <div className="p-4 text-center text-xs text-neutral-500">
              Searching...
            </div>
          ) : (
            <ul>
              {results.map((album) => {
                let linkPrefix = '/flac';
                if (album.type === 'lprip') linkPrefix = '/lprips';
                if (album.type === 'cdrip') linkPrefix = '/cdrips';

                return (
                  <li key={album.id}>
                    <Link 
                      href={`${linkPrefix}/${album.slug}`}
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-3 p-3 hover:bg-white/10 transition-colors border-b border-white/5 last:border-0"
                    >
                      <div className="relative w-10 h-10 rounded overflow-hidden shrink-0 bg-neutral-800">
                        <Image 
                          src={album.cover_url || '/images/placeholder.jpg'} 
                          alt="" 
                          fill 
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{album.title}</p>
                        <p className="text-xs text-neutral-400 truncate">{album.artist}</p>
                      </div>
                    </Link>
                  </li>
                );
              })}
              <li className="bg-neutral-950 p-2 text-center">
                 <button 
                   onClick={(e) => handleSubmit(e)}
                   className="text-xs text-red-400 hover:text-white transition-colors font-bold uppercase tracking-wider"
                 >
                   View All Results
                 </button>
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}