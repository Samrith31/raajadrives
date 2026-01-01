'use client';

import { use, useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { supabase } from '@/app/lib/supabase';
import Image from 'next/image';
import { notFound } from 'next/navigation';

import CommentSection from '@/app/components/CommentSection';
import BackgroundSlideshow from '@/app/components/BackgroundSlideshow';
import StarRating from '@/app/components/StarRating';
import DownloadButton from '@/app/components/DownloadButton';
import LikeButton from '@/app/components/LikeButton';

import { IconType } from 'react-icons';
import { HiCalendar } from 'react-icons/hi';
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
  rating_sum: number | null;
  rating_count: number | null;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface SpecCardProps {
  icon: IconType;
  label: string;
  value: string | number;
}

/* ---------------- COMPONENTS ---------------- */

function SpecCard({ icon: Icon, label, value }: SpecCardProps) {
  return (
    <div className="bg-white/[0.03] border border-white/5 p-5 rounded-2xl text-left hover:border-red-500/30 transition-colors group">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="text-neutral-500 group-hover:text-red-500 transition-colors" size={14} />
        <span className="text-[10px] text-neutral-500 uppercase tracking-widest group-hover:text-red-500 transition-colors">
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

export default function SinglePage({ params }: PageProps) {
  const { user } = useAuth();
  const { slug } = use(params);

  const [single, setSingle] = useState<DatabaseRow | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  

  useEffect(() => {
    let active = true;

    (async () => {
      const { data: release, error } = await supabase
        .from('releases')
        .select('*')
        .eq('slug', slug)
        .single();

      if (!active) return;

      if (error || !release) {
        setLoading(false);
        return;
      }

      let liked = false;
      let rating: number | null = null;

      if (user) {
        const [l, r] = await Promise.all([
          supabase
            .from('likes')
            .select('id')
            .eq('user_id', user.id)
            .eq('release_id', release.id)
            .maybeSingle(),

          supabase
            .from('ratings')
            .select('score')
            .eq('user_id', user.id)
            .eq('release_id', release.id)
            .maybeSingle(),
        ]);

        liked = !!l.data;
        rating = r.data?.score ?? null;
      }

      setSingle(release);
      setIsLiked(liked);
      setUserRating(rating);
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [slug, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!single) notFound();

  return (
    <div className="min-h-screen flex flex-col items-center pt-32 pb-20 px-6 relative isolate">
      <BackgroundSlideshow />

     <div className="max-w-2xl w-full z-10 flex flex-col items-center text-center">
        
        {/* 1. Artwork */}
        <div className="relative aspect-square w-full max-w-[340px] mb-8 group">
          <div className="absolute inset-0 bg-red-600/20 blur-3xl rounded-full scale-75 group-hover:scale-100 transition-transform duration-1000 opacity-50" />
          <div className="relative h-full w-full rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden border border-white/10">
            <Image
              src={single.cover_url || '/images/placeholder.jpg'}
              alt={single.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-[2s]"
              sizes="340px"
              priority
            />
            <div className="absolute top-4 left-4 px-3 py-1 bg-red-600 text-white text-[10px] font-black uppercase rounded-sm tracking-[0.2em] shadow-xl">
              {single.quality || 'Lossless'}
            </div>
          </div>
        </div>

        {/* Like */}
        <div className="mb-8">
          <LikeButton
            releaseId={single.id}
            onLikeToggle={(val) => setIsLiked(val)}
          />
        </div>

        {/* Title */}
         <div className="mb-10">
          <h1 className="font-display text-5xl md:text-6xl font-black text-white mb-3 tracking-tighter drop-shadow-2xl uppercase">
            {single.title}
          </h1>
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-red-600 shadow-[0_0_10px_#dc2626]" />
            <p className="text-xl text-neutral-400 font-medium tracking-widest uppercase italic">
              {single.artist}
            </p>
            <span className="h-px w-8 bg-red-600 shadow-[0_0_10px_#dc2626]" />
          </div>
        </div>

        {/* Rating */}
        <div className="mb-10 w-full p-6 bg-black/40 border border-white/5 rounded-3xl backdrop-blur-md">
                  <p className="text-[12px] font-black uppercase tracking-[0.3em] text-white mb-4">
  Like and Rate to Download..
</p>
     
          <StarRating
            albumId={single.id}
            onRate={(val) => setUserRating(val)}
          />
        </div>

        {/* Year */}
        <div className="flex justify-center w-full mb-12">
          <div className="max-w-[180px] w-full">
            <SpecCard icon={HiCalendar} label="Year" value={single.year || 'N/A'} />
          </div>
        </div>

        <DownloadButton
          downloadUrl={single.download_url}
          isLiked={isLiked}
          isRated={userRating !== null && userRating > 0}
        />

        {/* ADD TO CRATE TRIGGER PLACED HERE */}
                  <div className="mt-6 w-full flex justify-center">
  <AddToCrateTrigger releaseId={single.id} title={single.title} />
</div>
      </div>

      {/* Comments */}
      <div className="w-full max-w-2xl mt-24 z-10">
        <CommentSection slug={single.slug} />
      </div>
    </div>
  );
}
