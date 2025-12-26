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
  is_single: boolean; // Added this to fetch the flag from DB
}

interface Album {
  id: string;
  title: string;
  artist: string;
  slug: string;
  year: number;
  type: string;
  coverUrl: string | null;
  quality: string | null;
  linkPrefix: string; 
  isSingle: boolean; // Added for UI checks
}

export default async function AllUploadsPage() {
  // 1. Fetch EVERYTHING
  const { data, error } = await supabase
    .from('releases')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching catalog:", error);
  }

  // 2. Map Data & Fix Routing Logic
  const albums: Album[] = (data as DatabaseRow[] | null)?.map((item) => {
    
    // --- UPDATED ROUTING LOGIC ---
    let prefix = '/flac'; // Default

    // Logic: If it is marked as a single in DB, force /single prefix
    if (item.is_single === true || item.type === 'single') {
      prefix = '/single';
    } else if (item.type === 'lprip') {
      prefix = '/lprips';
    } else if (item.type === 'cdrip') {
      prefix = '/cdrips';
    }

    return {
      id: item.id,
      title: item.title,
      artist: item.artist,
      slug: item.slug,
      year: item.year,
      type: item.type,
      coverUrl: item.cover_url,
      quality: item.quality,
      linkPrefix: prefix,
      isSingle: item.is_single || item.type === 'single'
    };
  }) || [];

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 md:p-12 relative isolate">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-800 via-black to-black" />

      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-12 text-center md:text-left border-b border-white/10 pb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Master Catalog</h1>
          <p className="text-neutral-400">Complete archive of all uploads ({albums.length})</p>
        </div>

        {/* List */}
        <div className="space-y-4">
          {albums.map((album) => (
            <Link 
              key={album.id} 
              href={`${album.linkPrefix}/${album.slug}`} 
              className="group block"
            >
              <div className="relative flex items-center gap-6 p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-xl transition-all duration-300 backdrop-blur-sm">
                
                {/* Thumbnail */}
                <div className="relative w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-lg overflow-hidden shadow-lg bg-neutral-900">
                  <Image
                    src={album.coverUrl || '/images/placeholder.jpg'}
                    alt={album.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {/* Format Badge: Added Amber for Singles */}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide text-black ${
                      album.isSingle ? 'bg-amber-500' :
                      album.type === 'lprip' ? 'bg-purple-500' :
                      album.type === 'cdrip' ? 'bg-yellow-500' :
                      'bg-white'
                    }`}>
                      {album.isSingle ? 'SINGLE' : 
                       album.type === 'lprip' ? 'VINYL' : 
                       album.type === 'cdrip' ? 'CD RIP' : 'DIGITAL'}
                    </span>
                    
                    {album.quality && (
                      <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
                        {album.quality}
                      </span>
                    )}
                  </div>
                  
                  <h2 className="text-xl md:text-2xl font-bold text-white truncate group-hover:text-red-500 transition-colors">
                    {album.title}
                  </h2>
                  <p className="text-neutral-400 text-sm md:text-base truncate">
                    {album.artist} • <span className="text-neutral-500">{album.year}</span>
                  </p>
                </div>

                {/* Arrow Icon */}
                <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-full border border-white/10 text-neutral-500 group-hover:text-white group-hover:border-white/50 transition-all">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>

              </div>
            </Link>
          ))}

          {albums.length === 0 && (
            <div className="text-center py-20 text-neutral-500 border border-dashed border-neutral-800 rounded-xl">
              <p>No entries found in the database.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}