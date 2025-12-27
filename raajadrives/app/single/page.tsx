import { supabase } from '@/app/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';

// 0. Refresh data on every request
export const revalidate = 0;

interface DatabaseRow {
  id: string;
  created_at: string;
  title: string;
  artist: string;
  slug: string;
  year: number;
  type: string;
  cover_url: string | null;
  quality: string | null;
  is_single: boolean;
}

interface SingleTrack {
  id: string;
  title: string;
  artist: string;
  slug: string;
  year: number;
  type: string;
  coverUrl: string | null;
  quality: string | null;
}

export default async function SinglesListPage() {
  // 👇 1. FILTER: Only fetch records where is_single is TRUE
  const { data, error } = await supabase
    .from('releases')
    .select('*')
    .eq('is_single', true) 
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching Singles:", error);
  }

  // 2. Map Data
  const tracks: SingleTrack[] = (data as DatabaseRow[] | null)?.map((item) => ({
    id: item.id,
    title: item.title,
    artist: item.artist,
    slug: item.slug,
    year: item.year,
    type: item.type,
    coverUrl: item.cover_url,
    quality: item.quality,
  })) || [];

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 md:p-12 relative isolate">
      
      {/* Background Ambience (Amber/Gold tint for Singles) */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-black to-black" />

      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-12 text-center md:text-left border-b border-white/10 pb-8">
          <div className="flex items-center gap-3 mb-2 justify-center md:justify-start">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">Single <span className="text-neutral-500 italic font-light">Archive</span></h1>
          </div>
          <p className="text-neutral-400 font-medium tracking-wide">Individual Masterpieces & Standalone Tracks</p>
        </div>

        {/* List */}
        <div className="space-y-4">
          {tracks.map((track) => (
            <Link 
              key={track.id} 
              // 👇 Pointing to the Single detail page
              href={`/single/${track.slug}`} 
              className="group block"
            >
              <div className="relative flex items-center gap-6 p-4 bg-white/5 hover:bg-neutral-900 border border-white/5 hover:border-amber-500/30 rounded-2xl transition-all duration-500 backdrop-blur-sm shadow-xl">
                
                {/* Thumbnail */}
                <div className="relative w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-xl overflow-hidden shadow-2xl bg-neutral-900 border border-white/5">
                  <Image
                    src={track.coverUrl || '/images/placeholder.jpg'}
                    alt={track.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {/* Quality Badge */}
                    <span className="px-2 py-0.5 text-[9px] font-black text-black bg-amber-500 rounded uppercase tracking-widest">
                      {track.quality || 'LOSSLESS'}
                    </span>
                    {/* Year Label */}
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest font-mono">
                      REL. {track.year}
                    </span>
                  </div>
                  
                  <h2 className="text-xl md:text-2xl font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                    {track.title}
                  </h2>
                  <p className="text-neutral-400 text-sm md:text-base truncate font-medium italic">
                    {track.artist}
                  </p>
                </div>

                {/* Arrow Icon */}
                <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-full border border-white/5 text-neutral-600 group-hover:text-amber-500 group-hover:border-amber-500/50 group-hover:bg-amber-500/5 transition-all duration-500">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7-7 7" />
                  </svg>
                </div>

              </div>
            </Link>
          ))}

          {tracks.length === 0 && (
            <div className="text-center py-24 text-neutral-600 border border-dashed border-neutral-800 rounded-3xl font-mono uppercase tracking-[0.2em]">
              <p>Buffer Empty: No singles found in the archive.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}