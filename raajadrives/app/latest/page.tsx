import { supabase } from '@/app/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';

export const revalidate = 0;

// 1. Updated Interface with is_single toggle
interface DatabaseRow {
  id: string;
  title: string;
  artist: string;
  slug: string;
  year: number;
  type: string;
  cover_url: string | null;
  quality: string | null;
  is_single: boolean; // Added this
}

export default async function LatestPage() {
  const { data } = await supabase
    .from('releases')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(16);

  const albums = (data as DatabaseRow[] | null) || [];

  return (
    <div className="min-h-screen bg-neutral-950 pb-20">
      <div className="max-w-[1400px] mx-auto px-4 pt-12">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-red-500 font-bold tracking-[0.2em] text-xs uppercase">
              <span className="w-8 h-[1px] bg-red-500"></span>
              Fresh Arrivals
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-bold text-white tracking-tighter">
              New <span className="text-neutral-500 italic font-light">Drops.</span>
            </h1>
          </div>
          <p className="text-neutral-400 max-w-xs text-sm leading-relaxed border-l border-white/10 pl-4">
            The most recent additions to the Raaja Drives digital archive. High-fidelity audio preserved for the future.
          </p>
        </div>

        {/* --- GRID LAYOUT --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {albums.map((album) => {
            // --- 2. FIXED ROUTING LOGIC ---
            // Priority: If is_single is true, force /single path
            // Otherwise, use the type-based path
            let prefix = '/flac';
            
            if (album.is_single === true) {
             
            } else if (album.type === 'lprip') {
              prefix = '/lprips';
            } else if (album.type === 'cdrip') {
              prefix = '/cdrips';
            }

            return (
              <Link 
                key={album.id} 
                href={`${prefix}/${album.slug}`} 
                className="group relative"
              >
                {/* Image Container */}
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-900 border border-white/5 shadow-2xl">
                  <Image
                    src={album.cover_url || '/images/placeholder.jpg'}
                    alt={album.title}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-110 group-hover:rotate-1"
                  />
                  
                  {/* Glass Overlay on Hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6 backdrop-blur-[2px]">
                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                       {/* 3. DYNAMIC TAG COLOR (Amber for Single, Red for Album) */}
                       <span className={`inline-block px-2 py-1 text-[10px] font-bold text-white rounded mb-3 ${album.is_single ? 'bg-amber-500 text-black' : 'bg-red-600'}`}>
                         {album.is_single ? 'SINGLE' : album.type.toUpperCase()}
                       </span>
                       <h3 className="text-xl font-bold text-white leading-tight mb-1">{album.title}</h3>
                       <p className="text-neutral-300 text-sm truncate">{album.artist}</p>
                    </div>
                  </div>

                  {/* Top Quality Badge */}
                  {album.quality && (
                    <div className="absolute top-4 right-4 z-10">
                      <div className="px-2 py-1 bg-black/50 backdrop-blur-md border border-white/10 rounded text-[9px] font-bold text-white tracking-widest uppercase">
                        {album.quality}
                      </div>
                    </div>
                  )}
                </div>

                {/* Visible Info */}
                <div className="mt-4 flex justify-between items-start">
                  <div className="min-w-0">
                    <h3 className="text-white font-medium truncate group-hover:text-red-500 transition-colors">
                      {album.title}
                    </h3>
                    <p className="text-neutral-500 text-xs truncate italic">
                      {album.artist} • {album.year}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Empty State */}
        {albums.length === 0 && (
          <div className="py-40 text-center border border-dashed border-white/5 rounded-3xl">
            <p className="text-neutral-500 font-display text-xl tracking-widest">NO NEW RELEASES FOUND</p>
          </div>
        )}
      </div>
    </div>
  );
}