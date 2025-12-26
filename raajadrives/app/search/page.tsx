import { supabase } from '@/app/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';

export const revalidate = 0;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q: string }>;
}) {
  const { q } = await searchParams;
  const query = q || '';

  // 1. Search Supabase (Fetching all columns including is_single)
  const { data } = await supabase
    .from('releases')
    .select('*')
    .or(`title.ilike.%${query}%,artist.ilike.%${query}%`)
    .order('created_at', { ascending: false });

  const albums = data || [];

  return (
    <div className="min-h-[60vh] text-white">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 text-xs font-bold text-red-500 uppercase tracking-widest mb-2">
          <span className="w-6 h-[1px] bg-red-500"></span>
          Archive Search
        </div>
        <h2 className="text-3xl font-black tracking-tighter">
          Results for &quot;<span className="text-neutral-500 italic font-light">{query}</span>&quot;
        </h2>
        <p className="text-neutral-500 text-xs mt-2 uppercase tracking-widest">
          Found {albums.length} matching entries
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {albums.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-white/5 rounded-3xl">
            <p className="text-neutral-500 font-medium italic">No matching audio files found in the archive.</p>
          </div>
        ) : (
          albums.map((album) => {
            // --- 2. UPDATED ROUTING LOGIC ---
            let prefix = '/flac';
            const isActuallySingle = album.is_single === true || album.type === 'single';

            if (isActuallySingle) {
              prefix = '/single'; // Priority route for singles
            } else if (album.type === 'lprip') {
              prefix = '/lprips';
            } else if (album.type === 'cdrip') {
              prefix = '/cdrips';
            }

            return (
              <Link key={album.id} href={`${prefix}/${album.slug}`} className="group block">
                <div className={`flex items-center gap-5 p-4 bg-white/5 hover:bg-neutral-900 border transition-all duration-300 rounded-2xl
                  ${isActuallySingle ? 'border-amber-500/10 hover:border-amber-500/30' : 'border-white/5 hover:border-red-500/30'}
                `}>
                  
                  {/* Thumbnail */}
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-neutral-900 shrink-0 border border-white/5">
                    <Image 
                      src={album.cover_url || '/images/placeholder.jpg'} 
                      alt="" 
                      fill 
                      className="object-cover group-hover:scale-110 transition-transform duration-500" 
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {/* Dynamic Format Tag */}
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-[0.15em]
                        ${isActuallySingle ? 'bg-amber-500 text-black' : 'bg-neutral-800 text-neutral-400'}
                      `}>
                        {isActuallySingle ? 'SINGLE' : album.type.replace('-', ' ')}
                      </span>
                      
                      {album.quality && (
                        <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest font-mono">
                          {album.quality}
                        </span>
                      )}
                    </div>

                    <h3 className={`text-xl font-bold truncate transition-colors duration-300
                      ${isActuallySingle ? 'group-hover:text-amber-400' : 'group-hover:text-red-500'}
                    `}>
                      {album.title}
                    </h3>
                    <p className="text-sm text-neutral-500 font-medium italic">
                      {album.artist} • <span className="not-italic font-mono">{album.year}</span>
                    </p>
                  </div>

                  {/* Arrow Indicator */}
                  <div className={`hidden md:flex items-center justify-center w-10 h-10 rounded-full border border-white/5 transition-all duration-300
                    ${isActuallySingle ? 'group-hover:border-amber-500/50 group-hover:text-amber-400' : 'group-hover:border-red-500/50 group-hover:text-red-500'}
                  `}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}