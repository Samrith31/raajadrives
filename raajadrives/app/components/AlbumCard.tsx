'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Release } from '@/app/data/release';
import { HiHeart, HiOutlineHeart, HiStar } from 'react-icons/hi';
import { supabase } from '@/app/lib/supabase';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function AlbumCard({
  album,
  href,
  userRating,
}: {
  album: Release;
  href?: string;
  userRating?: number; 
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  const STORAGE_URL = "https://zkmmgecxdkrzyxfwiqnm.supabase.co/storage/v1/object/public/covers/";
  const cover = album.cover_url?.trim() || album.cover?.trim() || null;
  const imageSrc = cover ? (cover.startsWith("http") ? cover : `${STORAGE_URL}${cover}`) : "/images/logo-2.jpeg";

  const calculateHref = () => {
    if (href) return href;
    let folder = 'flac';
    if (album.isSingle || album.type === 'single') folder = 'single';
    else if (album.type === 'lprip') folder = 'lprips';
    else if (album.type === 'cdrip') folder = 'cdrips';
    return `/${folder}/${album.slug}`;
  };

  const finalHref = calculateHref();

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

  const toggleLike = async (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    if (!user) { router.push('/login'); return; }
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

  // --- RESTORED ORIGINAL COLOR LOGIC ---
  const getFormatStyles = (type: string, isSingle: boolean) => {
    if (isSingle) return "bg-amber-400 text-black border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.3)]"; 
    if (type === 'lprip') return "bg-indigo-500/20 text-indigo-300 border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.2)]"; 
    if (type === 'cdrip') return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]"; 
    return "bg-white/5 text-neutral-400 border-white/10"; 
  };

  const isSingle = album.isSingle || album.type === 'single';

  return (
    <Link
      href={finalHref}
      className="group relative block rounded-2xl md:rounded-[2.5rem] overflow-hidden bg-neutral-900/40 hover:bg-neutral-900/80 transition-all duration-500 border border-white/5 hover:border-white/20 active:scale-95"
    >
      <div className="relative aspect-square overflow-hidden bg-neutral-800">
        <Image
          src={imageSrc}
          alt={album.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover group-hover:scale-110 transition-transform duration-1000 ease-in-out"
        />
        
        {/* --- BRUTALIST LIME LED RATING --- */}
        {userRating !== undefined && (
          <div className="absolute top-0 left-0 z-30 p-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#adff2f] rounded-full shadow-[0_0_30px_rgba(173,255,47,0.6)] border-2 border-white/20 animate-in fade-in zoom-in duration-500">
              <HiStar className="text-black animate-pulse" size={18} />
              <div className="flex flex-col leading-none">
                <span className="text-[14px] font-black text-black italic tracking-tighter">
                  {userRating.toFixed(1)}
                </span>
                <span className="text-[7px] font-black text-black/60 uppercase tracking-widest">
                  LOVE
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Like Button */}
        <button 
          onClick={toggleLike}
          disabled={likeLoading}
          className="absolute top-4 right-4 z-40 p-2.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 hover:bg-white hover:text-black transition-all active:scale-90"
        >
          {isLiked ? (
            <HiHeart className="text-red-500 text-xl" />
          ) : (
            <HiOutlineHeart className="text-white text-xl" />
          )}
        </button>

        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
      </div>

      <div className="p-4 md:p-6">
        <h3 className="font-bold text-base md:text-lg tracking-tight truncate text-white italic">
          {album.title}
        </h3>
        <p className="text-[10px] text-neutral-500 uppercase tracking-[0.3em] mt-1 font-black">
          {album.artist}
        </p>

        {/* Bottom Metadata Row with Original Colors */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 shadow-[0_0_10px_#ef4444]" />
            <span className="text-[10px] font-black text-neutral-300 uppercase italic">
              {album.quality || 'Hi-Res'}
            </span>
          </div>
          
          <span className={`inline-flex shrink-0 items-center justify-center text-[8px] md:text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest border transition-all duration-300
            ${getFormatStyles(album.type, isSingle)}
          `}>
            {isSingle ? 'Single' : album.type.replace('-', ' ')}
          </span>
        </div>
      </div>
    </Link>
  );
}