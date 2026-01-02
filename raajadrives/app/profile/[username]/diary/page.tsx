'use client';

import { supabase } from '@/app/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';
import { HiArrowLeft, HiX, HiUserCircle, HiMusicNote } from 'react-icons/hi';
import { HiCalendar } from 'react-icons/hi2';
import { Release } from '@/app/data/release';
import { use, useEffect, useState } from 'react';
import AlbumCard from '@/app/components/AlbumCard';

// 1. Explicit Type Definitions
interface ArchiveEntry {
  created_at: string;
  releases: Release;
}

interface RatingRow {
  release_id: string;
  score: number;
}

interface DiaryData {
  profile: {
    id: string;
    username: string;
    avatar_url: string | null;
  } | null;
  logs: ArchiveEntry[];
  ratings: Record<string, number>;
}

export default function ArchiveDiary({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const [data, setData] = useState<DiaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getDiaryData() {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .eq('username', username)
        .single();

      if (!profile) {
        setData({ profile: null, logs: [], ratings: {} });
        setLoading(false);
        return;
      }

      const [logsRes, ratingsRes] = await Promise.all([
        supabase
          .from('likes')
          .select(`created_at, releases (*)`)
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('ratings')
          .select('release_id, score')
          .eq('user_id', profile.id)
      ]);

      const ratingMap: Record<string, number> = {};
      const typedRatings = ratingsRes.data as RatingRow[] | null;
      
      typedRatings?.forEach((r: RatingRow) => {
        ratingMap[r.release_id] = r.score;
      });

      setData({
        profile,
        logs: (logsRes.data as unknown as ArchiveEntry[]) || [],
        ratings: ratingMap
      });
      setLoading(false);
    }

    getDiaryData();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-2 border-red-600/20 border-t-red-600 rounded-full animate-spin mb-4" />
        <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-black italic">Syncing Timeline...</p>
      </div>
    );
  }

  const { profile, logs, ratings } = data!;

  if (!profile) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center mb-6 border border-white/5 shadow-2xl">
          <HiX className="text-red-600" size={28} />
        </div>
        <h1 className="text-2xl font-black uppercase italic text-white mb-2 tracking-tighter">Archivist Not Found</h1>
        <Link href="/" className="mt-4 px-8 py-3 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
          Return to Hub
        </Link>
      </div>
    );
  }

  return (
  <main className="min-h-screen bg-neutral-950 text-white pb-32">
    {/* Visual Background Gradient */}
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] md:h-[600px] bg-gradient-to-b from-red-950/20 to-transparent" />
    </div>

    {/* pt-4 pulls the whole page to the very top edge */}
    <div className="relative max-w-2xl mx-auto px-6 pt-4 md:pt-12 z-10">
      
    {/* --- HEADER SECTION: CENTERED PROFILE + USERNAME --- */}
{/* --- HEADER SECTION: FULLY CENTERED DESKTOP TOO --- */}
<div className="relative mb-10 md:mb-20 text-center">
  {/* Back Arrow - Always Absolute Top-Left */}
  <Link 
    href={`/profile/${username}`} 
    className="absolute left-6 top-6 p-2.5 bg-neutral-900 border border-white/5 rounded-full text-neutral-400 hover:text-white transition-all active:scale-90 shadow-lg z-20"
  >
    <HiArrowLeft size={18} />
  </Link>

  {/* FULLY CENTERED: Profile Pic + Username + Entry Count */}
  <div className="flex flex-col items-center gap-3 pt-14 md:pt-16 max-w-md mx-auto">
    {/* Profile Pic */}
    <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-red-600/30 bg-neutral-900 shadow-2xl">
      {profile.avatar_url ? (
        <Image 
          src={profile.avatar_url} 
          alt={profile.username} 
          fill 
          className="object-cover" 
          unoptimized 
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-neutral-700">
          <HiUserCircle size={44} />
        </div>
      )}
    </div>

    {/* Username + Note */}
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-2">
        <HiMusicNote className="text-yellow-500 text-lg md:text-xl flex-shrink-0" />
        <h2 className="text-xl md:text-3xl lg:text-4xl font-black tracking-tight italic uppercase leading-none">
          {profile.username}
        </h2>
      </div>
      <div className="inline-flex items-center gap-1.5 text-red-500 text-[8px] md:text-[10px] font-black uppercase tracking-widest italic">
        Archive Diary
      </div>
    </div>

    {/* Entry Count - Centered Below */}
    <p className="text-[9px] md:text-[10px] text-neutral-600 uppercase tracking-[0.4em] font-mono">
      {logs.length} Entries Logged
    </p>
  </div>
</div>


      {/* --- TIMELINE LIST: Also moves up because header margins were reduced --- */}
      <div className="relative space-y-12 md:space-y-16">
        <div className="absolute left-[24px] md:left-[40px] top-2 bottom-6 w-[1px] bg-gradient-to-b from-red-600/50 via-neutral-800 to-transparent hidden sm:block" />

        {logs.map((log: ArchiveEntry) => {
          const date = new Date(log.created_at);
          return (
            <div key={`${log.releases.id}-${log.created_at}`} className="relative flex gap-6 md:gap-14 group">
              {/* DATE MARKER */}
              <div className="w-12 md:w-20 flex-shrink-0 text-center relative z-10">
                <div className="bg-neutral-950 py-2 md:py-3 rounded-2xl border border-white/5 group-hover:border-red-600/50 transition-colors shadow-xl">
                  <span className="text-[8px] md:text-[11px] font-black text-red-600 uppercase block tracking-tighter mb-1">
                    {date.toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                  <span className="text-lg md:text-4xl font-black italic leading-none block my-1 group-hover:text-red-500 transition-colors">
                    {date.getDate()}
                  </span>
                  <span className="text-[7px] md:text-[10px] text-neutral-600 font-mono block">
                    {date.getFullYear()}
                  </span>
                </div>
              </div>

              {/* ALBUM CARD */}
              <div className="flex-1">
                <div className="max-w-[220px] md:max-w-[300px] group-hover:-translate-y-2 transition-transform duration-500 ease-out">
                  <AlbumCard 
                    album={log.releases} 
                    userRating={ratings[log.releases.id]} 
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </main>
);
}