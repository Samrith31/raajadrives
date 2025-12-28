'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/app/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface SearchResult {
  id: string;
  title: string;
  artist: string;
  slug: string;
  type: string;
  cover_url: string | null;
  is_single: boolean;
}

interface SearchBarProps {
  onSubmit?: () => void; // callback to close overlay on mobile
}

export default function SearchBar({ onSubmit }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length < 2) {
        setResults([]);
        return; 
      }

      setIsLoading(true);

      const { data, error } = await supabase
        .from('releases')
        .select('id, title, artist, slug, type, cover_url, is_single')
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
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

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
      if (onSubmit) onSubmit(); // close mobile overlay
    }
  };

  return (
    <div ref={searchRef} className="relative group z-50">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          placeholder="Search archive..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
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

      {showDropdown && results.length > 0 && (
        <div className="absolute top-full right-0 mt-3 w-80 bg-neutral-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {isLoading ? (
            <div className="p-4 text-center text-xs text-neutral-500 font-mono uppercase tracking-widest">
              Searching Archive...
            </div>
          ) : (
            <ul>
              {results.map((album) => {
                let linkPrefix = '/flac';
                if (album.is_single) linkPrefix = '/single';
                else if (album.type === 'lprip') linkPrefix = '/lprips';
                else if (album.type === 'cdrip') linkPrefix = '/cdrips';

                return (
                  <li key={album.id}>
                    <Link
                      href={`${linkPrefix}/${album.slug}`}
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-3 p-3 hover:bg-white/10 transition-colors border-b border-white/5 last:border-0 group/item"
                    >
                      <div className="relative w-10 h-10 rounded-md overflow-hidden shrink-0 bg-neutral-800 border border-white/5">
                        <Image src={album.cover_url || '/images/placeholder.jpg'} alt="" fill className="object-cover"/>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-white truncate group-hover/item:text-red-500 transition-colors">{album.title}</p>
                          {album.is_single && (
                            <span className="text-[8px] font-black bg-amber-500 text-black px-1 rounded uppercase tracking-tighter shrink-0">Single</span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-400 truncate font-medium italic">{album.artist}</p>
                      </div>
                    </Link>
                  </li>
                );
              })}
              <li className="bg-neutral-950 p-2.5 text-center border-t border-white/5">
                <button
                  onClick={handleSubmit}
                  className="text-[10px] text-neutral-500 hover:text-white transition-colors font-black uppercase tracking-[0.2em]"
                >
                  Expand All Results
                </button>
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
