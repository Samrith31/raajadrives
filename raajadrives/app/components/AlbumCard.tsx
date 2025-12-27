'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Release } from '@/app/data/release';
import { HiHeart, HiOutlineHeart } from 'react-icons/hi';
import { supabase } from '@/app/lib/supabase';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function AlbumCard({
  album,
  href,
}: {
  album: Release;
  href?: string;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  // --- 1. STORAGE CONFIG ---
  // This constructs the full path to your covers bucket
const STORAGE_URL =
  "https://zkmmgecxdkrzyxfwiqnm.supabase.co/storage/v1/object/public/covers/";

const cover =
  album.cover_url?.trim() ||
  album.cover?.trim() ||
  null;

const imageSrc = cover
  ? cover.startsWith("http")
    ? cover
    : `${STORAGE_URL}${cover}`
  : "/images/logo-2.jpeg";


  // --- 2. Automatic Routing Logic ---
  const calculateHref = () => {
    if (href) return href;
    let folder = 'flac';
    if (album.isSingle || album.type === 'single') folder = 'single';
    else if (album.type === 'lprip') folder = 'lprips';
    else if (album.type === 'cdrip') folder = 'cdrips';
    return `/${folder}/${album.slug}`;
  };

  const finalHref = calculateHref();

  // --- 3. Like Status Sync ---
  useEffect(() => {
    if (user) {
      const checkLikeStatus = async () => {
        const { data } = await supabase
          .from('likes')
          .select('id')
          .eq('user_id', user.id)
          .eq('release_id', album.id)
          .maybeSingle();
        if (data) setIsLiked(true);
      };
      checkLikeStatus();
    }
  }, [user, album.id]);

  // --- 4. Toggle Like Function ---
  const toggleLike = async (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();

    if (!user) {
      router.push('/login');
      return;
    }

    setLikeLoading(true);
    if (isLiked) {
      await supabase.from('likes').delete().eq('user_id', user.id).eq('release_id', album.id);
      setIsLiked(false);
    } else {
      await supabase.from('likes').insert({ user_id: user.id, release_id: album.id });
      setIsLiked(true);
    }
    setLikeLoading(false);
  };

  const getFormatStyles = (type: string, isSingle: boolean) => {
    if (isSingle) return "bg-amber-400 text-black border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.2)]"; 
    if (type === 'lprip') return "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"; 
    if (type === 'cdrip') return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"; 
    return "bg-white/5 text-neutral-400 border-white/10"; 
  };

  const isSingle = album.isSingle || album.type === 'single';

  return (
    <Link
      href={finalHref}
      className="group relative block rounded-xl md:rounded-2xl overflow-hidden bg-neutral-900/40 hover:bg-neutral-900/80 transition-all duration-500 border border-white/5 hover:border-white/20 active:scale-[0.98] md:active:scale-100"
    >
      {/* Artwork Container */}
      <div className="relative aspect-square overflow-hidden bg-neutral-800">
        <Image
          src={imageSrc}
          alt={album.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover group-hover:scale-110 transition-transform duration-1000 ease-in-out"
        />
        
        {/* Heart Button Overlay */}
        <button 
          onClick={toggleLike}
          disabled={likeLoading}
          className="absolute top-3 right-3 z-20 p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-white hover:text-black transition-all active:scale-90"
        >
          {isLiked ? (
            <HiHeart className="text-red-500 text-lg md:text-xl" />
          ) : (
            <HiOutlineHeart className="text-white text-lg md:text-xl" />
          )}
        </button>

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 md:opacity-60" />
      </div>

      <div className="p-3 md:p-5">
        <h3 className="font-display font-bold text-sm md:text-[15px] tracking-tight truncate text-neutral-100 group-hover:text-white transition-colors">
          {album.title}
        </h3>
        
        <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-[11px] font-medium text-neutral-500 mt-1 md:mt-1.5 uppercase tracking-wider">
          <span className="text-neutral-400 truncate max-w-[80px] md:max-w-[120px]">{album.artist}</span>
          {album.year && (
            <>
              <span className="w-1 h-1 rounded-full bg-neutral-800" />
              <span className="font-mono text-neutral-600">{album.year}</span>
            </>
          )}
        </div>

        <div className="mt-4 md:mt-5 flex items-center justify-between gap-2">
          {album.quality ? (
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-1 h-1 md:w-1.5 md:h-1.5 shrink-0 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
              <span className="text-[8px] md:text-[10px] font-black text-neutral-300 uppercase tracking-widest italic truncate">
                {album.quality}
              </span>
            </div>
          ) : <div />}

          <span className={`inline-flex shrink-0 items-center justify-center text-[8px] md:text-[9px] font-black px-2 md:px-2.5 py-0.5 md:py-1 rounded md:rounded-md uppercase tracking-[0.1em] border transition-all duration-300
            ${getFormatStyles(album.type, isSingle)}
          `}>
            {isSingle ? 'Single' : album.type.replace('-', ' ')}
          </span>
        </div>
      </div>
    </Link>
  );
}