'use client';

import { use, useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import { useAuth } from '@/app/context/AuthContext';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import CommentSection from '@/app/components/CommentSection';
import BackgroundSlideshow from '@/app/components/BackgroundSlideshow';
import StarRating from '@/app/components/StarRating';
import DownloadButton from '@/app/components/DownloadButton';
import LikeButton from '@/app/components/LikeButton';
import { IconType } from 'react-icons';
import { HiOutlineDatabase, HiOutlineMusicNote, HiCalendar } from 'react-icons/hi';
import AddToCrateTrigger from '@/app/components/AddToCrateTrigger';

/* ---------------- TYPES ---------------- */

interface DatabaseRow {
  id: string;
  created_at: string;
  title: string;
  artist: string;
  slug: string;
  year: number;
  type: string;
  quality: string | null;
  cover_url: string | null;
  download_url: string;
}

interface AlbumPageProps {
  params: Promise<{ slug: string }>;
}

interface SpecCardProps {
  icon: IconType;
  label: string;
  value: string | number;
}

/* ---------------- HELPER ---------------- */

function SpecCard({ icon: Icon, label, value }: SpecCardProps) {
  return (
    <div className="bg-white/[0.03] border border-white/5 p-5 rounded-2xl text-left hover:border-red-500/30 transition-colors group">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="text-neutral-500 group-hover:text-red-500 transition-colors" size={14} />
        <span className="block text-[10px] text-neutral-500 uppercase tracking-widest group-hover:text-red-500 transition-colors">
          {label}
        </span>
      </div>
      <span className="text-sm text-white font-bold uppercase tracking-tight">
        {value}
      </span>
    </div>
  );
}

/* ---------------- PAGE ---------------- */

export default function AlbumPage({ params }: AlbumPageProps) {
  const { user } = useAuth();
  const { slug } = use(params);

  const [state, setState] = useState<{
    album: DatabaseRow | null;
    isLiked: boolean;
    userRating: number | null;
    loading: boolean;
  }>({
    album: null,
    isLiked: false,
    userRating: null,
    loading: true,
  });

  useEffect(() => {
    let active = true;

    (async () => {
      const { data: album } = await supabase
        .from('releases')
        .select('*')
        .eq('slug', slug)
        .single();

      if (!album || !active) {
        if (active) setState(s => ({ ...s, loading: false }));
        return;
      }

      let isLiked = false;
      let userRating: number | null = null;

      if (user) {
        const [l, r] = await Promise.all([
          supabase
            .from('likes')
            .select('id')
            .eq('user_id', user.id)
            .eq('release_id', album.id)
            .maybeSingle(),
          supabase
            .from('ratings')
            .select('score')
            .eq('user_id', user.id)
            .eq('release_id', album.id)
            .maybeSingle(),
        ]);

        isLiked = !!l.data;
        userRating = r.data?.score ?? null;
      }

      if (!active) return;

      setState({
        album: album as DatabaseRow,
        isLiked,
        userRating,
        loading: false,
      });
    })();

    return () => {
      active = false;
    };
  }, [slug, user]);

  const { album, isLiked, userRating, loading } = state;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!album) notFound();

  return (
    <div className="min-h-screen flex flex-col items-center pt-32 pb-20 px-6 relative isolate">
      <BackgroundSlideshow />

      <div className="max-w-2xl w-full z-10 flex flex-col items-center text-center">
        
        {/* 1. Artwork */}
         <div className="relative aspect-square w-full max-w-[340px] mb-8 group">
                 <div className="absolute inset-0 bg-red-600/20 blur-3xl rounded-full scale-75 group-hover:scale-100 transition-transform duration-1000 opacity-50" />
                 <div className="relative h-full w-full rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden border border-white/10">
                   <Image
                     src={album.cover_url || '/images/placeholder.jpg'}
                     alt={album.title}
                     fill
                     unoptimized={true}
                     className="object-cover group-hover:scale-105 transition-transform duration-[2s]"
                     sizes="340px"
                     priority
                   />
                   <div className="absolute top-4 left-4 px-3 py-1 bg-red-600 text-white text-[10px] font-black uppercase rounded-sm tracking-[0.2em] shadow-xl">
                     {album.quality || 'Lossless'}
                   </div>
                 </div>
               </div>

        {/* 2. Like */}
        <div className="mb-8">
          <LikeButton
            releaseId={album.id}
            onLikeToggle={(val) =>
              setState(s => ({ ...s, isLiked: val }))
            }
          />
        </div>

        {/* 3. Title */}
        <div className="mb-10">
          <h1 className="font-display text-5xl md:text-6xl font-black text-white mb-3 tracking-tighter drop-shadow-2xl uppercase">
            {album.title}
          </h1>
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-red-600 shadow-[0_0_10px_#dc2626]" />
            <p className="text-xl text-neutral-400 font-medium tracking-widest uppercase italic">
              {album.artist}
            </p>
            <span className="h-px w-8 bg-red-600 shadow-[0_0_10px_#dc2626]" />
          </div>
        </div>

        {/* 4. Rating */}
        <div className="mb-10 w-full p-6 bg-black/40 border border-white/5 rounded-3xl backdrop-blur-md shadow-2xl">
         <p className="text-[12px] font-black uppercase tracking-[0.3em] text-white mb-4">
  Like and Rate to Download..
</p>
          <StarRating
            albumId={album.id}
            onRate={(val) =>
              setState(s => ({ ...s, userRating: val }))
            }
          />
        </div>

        {/* 5. Specs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full mb-12 font-mono">
          <SpecCard icon={HiCalendar} label="Year" value={album.year || 'N/A'} />
          <SpecCard
            icon={HiOutlineDatabase}
            label="Source"
            value={
              album.type === 'lprip'
                ? 'Vinyl'
                : album.type === 'cdrip'
                ? 'CD'
                : 'Digital'
            }
          />
          <div className="hidden sm:block">
            <SpecCard
              icon={HiOutlineMusicNote}
              label="Format"
              value={
                album.type === 'lprip' || album.type === 'cdrip'
                  ? 'WAV'
                  : 'FLAC'
              }
            />
          </div>
        </div>

        {/* 6. Download & Actions */}
       <div className="w-full flex flex-col items-center gap-4">
  {/* Download Button on Top */}
  <DownloadButton
    downloadUrl={album.download_url}
    isLiked={isLiked}
    isRated={userRating !== null && userRating > 0}
  />

  {/* Add to Crate Trigger directly below */}
  <div className="w-full max-w-[340px] opacity-80 hover:opacity-100 transition-opacity">
    <AddToCrateTrigger 
      releaseId={album.id} 
      title={album.title} 
    />
  </div>
          
          <p className="text-[9px] text-neutral-500 uppercase tracking-[0.3em] font-bold">
            Archivist Vault Security Protocol
          </p>
        </div>
      </div>

      {/* 7. Comments */}
      <div className="w-full max-w-2xl mt-24 z-10">
        <div className="flex items-center gap-4 mb-10">
          <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white italic">
            Listener <span className="text-neutral-600">Feedback</span>
          </h2>
          <div className="h-px w-full bg-gradient-to-r from-white/20 to-transparent" />
        </div>
        <CommentSection slug={album.slug} />
      </div>
    </div>
  );
}