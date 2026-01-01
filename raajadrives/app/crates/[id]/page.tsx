import { supabase } from '@/app/lib/supabase';
import AlbumCard from '@/app/components/AlbumCard';
import { HiArchive, HiChevronLeft, HiUser, HiPlay, HiPause, HiVolumeUp } from 'react-icons/hi';
import { PiVanBold } from 'react-icons/pi';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Release, ReleaseType } from '@/app/data/release';
import {HiHeart, HiDotsHorizontal } from 'react-icons/hi';
import Image from 'next/image';
/* ---------- STRICT TYPES ---------- */
interface ReleaseRow {
  id: string; title: string; artist: string; slug: string;
  cover_url: string | null; type: string; quality: string | null;
  download_url: string; is_single: boolean | null;
}

interface CrateItemRow {
  id: string; // The unique ID for the crate entry itself
  release_id: string;
  releases: ReleaseRow | null;
}

interface ProfileData {
  username: string;
  avatar_url: string | null;
}

interface CrateRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  crate_id_label: string;
  profiles: ProfileData | ProfileData[]; 
}

const isReleaseType = (type: string): type is ReleaseType => {
  const validTypes = [
    'album', 'single', 'flac', 
    'hiresflac', 'hires-flac', 
    'cdflac', 'cd-flac', 
    'cdrip', 'lprip'
  ];
  return validTypes.includes(type.toLowerCase().trim());
};

/* ---------- PAGE ---------- */
export default async function CrateDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const crateId = resolvedParams.id;

  if (!crateId) return notFound();

  /* --- 1. Fetch Crate & Owner --- */
  const { data: crateData, error: crateError } = await supabase
    .from('crates')
    .select(`
      id, 
      user_id, 
      title, 
      description, 
      crate_id_label, 
      profiles:user_id (username, avatar_url)
    `)
    .eq('id', crateId)
    .single();

  if (crateError || !crateData) {
    console.error("Fetch Error:", crateError);
    return notFound();
  }

  const crate = crateData as unknown as CrateRow;
  const ownerProfile = Array.isArray(crate.profiles) ? crate.profiles[0] : crate.profiles;

  /* --- 2. Fetch Crate Items (Including Unique Link ID) --- */
  const { data: itemsData } = await supabase
    .from('crate_items')
    .select('id, release_id, releases(*)')
    .eq('crate_id', crateId);

  const rawItems = itemsData as unknown as CrateItemRow[] | null;

  // Map data into a structure that holds both the unique Key and the Release data
  const formattedItems = (rawItems ?? [])
    .filter((item): item is CrateItemRow & { releases: ReleaseRow } => 
      item.releases !== null && isReleaseType(item.releases.type)
    )
    .map((item) => ({
      crateEntryId: item.id, // Unique ID for React Key
      release: {
        id: item.releases.id,
        title: item.releases.title,
        artist: item.releases.artist,
        slug: item.releases.slug,
        type: item.releases.type as ReleaseType,
        quality: item.releases.quality ?? undefined,
        cover: item.releases.cover_url || '/images/placeholder.jpg',
        downloadUrl: item.releases.download_url,
        isSingle: Boolean(item.releases.is_single),
      } as Release
    }));

return (
  <main className="
    min-h-screen relative overflow-hidden
    bg-[#0A0A0B] text-[#F4F4F5]
    px-6 md:px-12 py-12
    selection:bg-rose-600 selection:text-white
  ">
    {/* High-End UI Detail: Mesh Gradient & Grid overlay */}
    <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-rose-950/20 to-transparent pointer-events-none" />
    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

    <div className="max-w-7xl mx-auto relative z-10">
      
      {/* Navigation */}
      <Link
        href="/"
        className="
          inline-flex items-center gap-2 mb-16
          text-[10px] font-mono uppercase tracking-[0.4em]
          text-white/30 hover:text-rose-500 transition-all
        "
      >
        <HiChevronLeft size={14} />
        Return to Drive
      </Link>

      {/* Artist-Style Header (Similar to your uploaded image) */}
      <header className="mb-24">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-8 md:gap-12">
          {/* Circular Crate Avatar */}
          <div className="relative group">
            <div className="
              w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden 
              border-4 border-[#1A1A1C] shadow-2xl
              bg-gradient-to-br from-rose-600 to-rose-950
            ">
               <div className="w-full h-full flex items-center justify-center bg-black/40 backdrop-blur-sm">
                 <Image 
                                src="/images/crate-logo.jpeg"
                                alt="Crate Logo"
                                width={96}
                                height={96}
                                className="w-4/5 h-4/5 object-contain rounded-full"
                                priority
                              />
               </div>
            </div>
            {/* Play Button Overlay */}
            <button className="
              absolute bottom-2 right-2 w-14 h-14 rounded-full 
              bg-rose-600 text-white flex items-center justify-center
              shadow-xl hover:scale-110 transition-transform duration-300
            ">
              <HiPlay size={28} className="ml-1" />
            </button>
          </div>

          <div className="flex-1 text-center md:text-left">
             <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
               <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 text-[10px] font-mono border border-rose-500/20 rounded">
                {crate.crate_id_label}
               </span>
               <span className="text-white/40 text-[10px] font-mono uppercase tracking-widest">
                {formattedItems.length} Tracks Indexed
               </span>
             </div>
             
             <h1 className="
               text-6xl md:text-8xl 
               font-black tracking-tighter mb-6
               leading-none uppercase
             ">
               {crate.title}
             </h1>

             <p className="text-white/50 text-base md:text-lg max-w-xl font-light leading-relaxed italic">
               &quot;{crate.description || 'A strictly curated selection of sonic artifacts.'}&quot;
             </p>
          </div>
        </div>

        {/* Tab-style Navigation (Mimicking the image) */}
        <nav className="flex gap-8 mt-16 border-b border-white/5 text-[11px] font-mono uppercase tracking-widest text-white/40">
          <button className="pb-4 border-b-2 border-rose-600 text-white">Collection</button>
        
        </nav>
      </header>

      {/* Grid - Standardized to the Deezer/Spotify layout in your image */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-8 gap-y-12">
        {formattedItems.length ? (
          formattedItems.map(item => (
            <div key={item.crateEntryId} className="group flex flex-col gap-4">
              {/* Image Container with Hover Effect */}
              <div className="
                relative aspect-square rounded-xl overflow-hidden
                bg-[#161618] border border-white/5
                transition-all duration-500 group-hover:shadow-[0_20px_40px_rgba(225,29,72,0.15)]
              ">
                <AlbumCard album={item.release} />
                
                {/* Minimalist Play Overlay */}
                <div className="
                  absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 
                  transition-opacity duration-300 flex items-center justify-center
                ">
                  <div className="w-12 h-12 rounded-full bg-rose-600 flex items-center justify-center translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <HiPlay size={24} className="text-white ml-1" />
                  </div>
                </div>
              </div>

              {/* Text Meta (Simulating the image text style) */}
              <div>
                <h3 className="text-sm font-bold truncate tracking-tight">{item.release.title}</h3>
                <p className="text-xs text-white/40 mt-1 uppercase tracking-tighter font-mono">
                  {item.release.artist} • FLAC
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-32 text-center border border-dashed border-white/5 rounded-2xl">
            <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/20">Empty Archive</p>
          </div>
        )}
      </div>
    </div>
  </main>
);}