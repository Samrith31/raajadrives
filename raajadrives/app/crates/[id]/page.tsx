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
    selection:bg-rose-600 selection:text-white
  ">
    {/* GLOBAL UI BACKGROUNDS */}
    <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-rose-950/20 to-transparent pointer-events-none" />
    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

    {/* --- MOBILE VIEW ONLY (Image 2 Aesthetic) --- */}
    <div className="md:hidden relative min-h-screen flex flex-col px-6 pt-12 pb-32">
      {/* Blurred Backdrop Glow */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-rose-600/20 blur-[100px] rounded-full pointer-events-none" />
      
      {/* Top Nav */}
      <div className="flex justify-between items-center mb-10 relative z-10">
        <Link href="/" className="p-2 bg-white/5 rounded-full border border-white/10"><HiChevronLeft size={20} /></Link>
        <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/40">Crate Archive</span>
        <button className="p-2 bg-white/5 rounded-full border border-white/10"><HiDotsHorizontal size={20} /></button>
      </div>

{/* Corrected Artist-Style Header */}
<div className="flex flex-col md:flex-row items-center md:items-end gap-8 md:gap-12 mb-16 md:mb-24">
  
  {/* Avatar Section */}
  <div className="relative group shrink-0">
    <div className="
      w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden 
      border-4 border-[#1A1A1C] shadow-2xl
      bg-gradient-to-br from-rose-600 to-rose-950
    ">
      <div className="w-full h-full flex items-center justify-center bg-black/40 backdrop-blur-sm relative">
        {/* Subtle Vinyl Groove Overlay */}
        <div className="absolute inset-0 rounded-full opacity-20 bg-[repeating-radial-gradient(circle,transparent_0px,transparent_1px,#000_3px,#000_5px)]" />
        
        <Image 
          src="/images/crate-logo.jpeg"
          alt="Crate Logo"
          width={96}
          height={96}
          unoptimized={true}
          className="w-4/5 h-4/5 object-contain rounded-full relative z-10"
          priority
        />
      </div>
    </div>

    {/* Play Button */}
    <button className="
      absolute bottom-2 right-2 w-14 h-14 rounded-full 
      bg-rose-600 text-white flex items-center justify-center
      shadow-xl hover:scale-110 transition-transform duration-300
      border-4 border-[#0A0A0B]
    ">
      <HiPlay size={28} className="ml-1" />
    </button>
  </div>

  {/* Text Content - Wrapped for correct alignment */}
  <div className="flex flex-col items-center md:items-start text-center md:text-left flex-1">
    <p className="text-[10px] font-mono text-rose-500 uppercase tracking-[0.4em] mb-3">
      {crate.crate_id_label}
    </p>
    
    <h1 className="
      text-4xl md:text-8xl 
      font-black tracking-tighter uppercase mb-4 
      leading-none italic text-white
    ">
      {crate.title}
    </h1>

    <p className="
      text-xs md:text-lg text-white/50 
      leading-relaxed italic max-w-[280px] md:max-w-xl
    ">
      &quot;{crate.description || 'A strictly curated selection of sonic artifacts.'}&quot;
    </p>
  </div>
</div>

      {/* Track List (Image 2 Style) */}
      <div className="space-y-4 relative z-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xs font-mono uppercase tracking-widest text-white/30">Your Raaja Collections.</h2>
          <HiVolumeUp size={16} className="text-white/20" />
        </div>
{formattedItems.map(item => (
    <div key={item.crateEntryId} className="group flex flex-col gap-4">
      {/* 1. IMAGE CONTAINER: Glass Border & Hover Lift */}
<div className="
        relative aspect-square rounded-2xl md:rounded-[1.5rem] overflow-hidden 
        border border-white/5 shadow-xl 
        transition-all duration-500 
        group-hover:-translate-y-1.5 group-hover:shadow-rose-600/10
      ">
        <AlbumCard album={item.release} />
      </div>

      {/* 2. TEXT CONTENT: Dynamic Links & High-End Metadata */}
      <div className="mt-2 px-1">
        {/* Title Link with Slug Fallback Fix */}
        <Link 
          href={`/releases/${item.release.slug || item.release.id}`} 
          className="block group/title"
        >
          <h3 className="
            text-sm font-bold truncate tracking-tight text-white 
            group-hover/title:text-rose-500 transition-colors
          ">
            {item.release.title}
          </h3>
        </Link>

        {/* Metadata Row */}
        <div className="flex items-center justify-between mt-2.5">
          <p className="text-[10px] text-white/40 uppercase font-mono tracking-[0.15em] truncate max-w-[65%]">
            {item.release.artist}
          </p>

          {/* HIGH-END ROSE BADGE (Image 2 Aesthetic) */}
          <div className="
            text-[8px] font-mono font-black italic uppercase tracking-[0.1em]
            px-2 py-0.5 rounded-md
            bg-rose-500/10 text-rose-500 
            border border-rose-500/20 
            shadow-[0_0_10px_rgba(225,29,72,0.15)] 
            backdrop-blur-sm
          ">
            {item.release.type}
          </div>
        </div>
      </div>
    </div>
  ))}
      </div>

      {/* Floating Glass Bottom Bar (Image 2) */}
      <div className="fixed bottom-6 left-6 right-6 h-16 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-around px-8 z-[100] shadow-2xl">
         <HiArchive className="text-rose-600" size={24} />
         <HiPlay className="text-white/40" size={24} />
         <HiUser className="text-white/40" size={24} />
      </div>
    </div>

    {/* --- DESKTOP VIEW ONLY (Existing Premium Grid) --- */}
    <div className="hidden md:block max-w-7xl mx-auto relative z-10">
       <Link href="/" className="inline-flex items-center gap-2 mb-16 text-[10px] font-mono uppercase tracking-[0.4em] text-white/30 hover:text-rose-500 transition-all">
        <HiChevronLeft size={14} /> Return to Drive
      </Link>

      <header className="mb-24">
        <div className="flex flex-row items-end gap-12">
          <div className="relative group">
            <div className="w-56 h-56 rounded-full overflow-hidden border-4 border-[#1A1A1C] shadow-2xl bg-gradient-to-br from-rose-600 to-rose-950">
               <div className="w-full h-full flex items-center justify-center bg-black/40 backdrop-blur-sm">
                 <Image src="/images/crate-logo.jpeg" alt="Logo" width={96} height={96} className="w-4/5 h-4/5 object-contain rounded-full" />
               </div>
            </div>
            <button className="absolute bottom-2 right-2 w-14 h-14 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xl hover:scale-110 transition-all"><HiPlay size={28} className="ml-1" /></button>
          </div>

          <div className="flex-1">
             <div className="flex items-center gap-3 mb-4">
               <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 text-[10px] font-mono border border-rose-500/20 rounded">{crate.crate_id_label}</span>
               <span className="text-white/40 text-[10px] font-mono uppercase tracking-widest">{formattedItems.length} Tracks Indexed</span>
             </div>
             <h1 className="text-8xl font-black tracking-tighter mb-6 leading-none uppercase">{crate.title}</h1>
             <p className="text-white/50 text-lg max-w-xl font-light italic">&quot;{crate.description}&quot;</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
        {formattedItems.map(item => (
          <div key={item.crateEntryId} className="group flex flex-col gap-4">
            <div className="relative aspect-square rounded-3xl overflow-hidden border border-white/5 shadow-2xl transition-transform hover:-translate-y-2 duration-500">
              <AlbumCard album={item.release} />
            </div>
            <div className="mt-2">
              <h3 className="text-sm font-bold truncate">{item.release.title}</h3>
              <p className="text-[10px] text-white/40 uppercase font-mono">{item.release.artist} • {item.release.type.toUpperCase()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </main>
);}