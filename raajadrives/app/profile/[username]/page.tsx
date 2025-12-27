'use client';

import { useEffect, useState, use } from 'react';
import { supabase } from '@/app/lib/supabase';
import Image from 'next/image';
import AlbumCard from '@/app/components/AlbumCard';
import {
  HiHeart,
  HiCollection,
  HiCalendar,
  HiBadgeCheck,
  HiLogout,
} from 'react-icons/hi';
import { Release } from '@/app/data/release';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: string;
  username: string;
  created_at: string;
}

interface LikeRow {
  release_id: string;
}

interface RatingRow {
  release_id: string; // Reverted to release_id
  score: number;      // Reverted to score
}

export default function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const { user, signOut } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [likedReleases, setLikedReleases] = useState<Release[]>([]);
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  useEffect(() => {
    const fetchProfile = async () => {
      // 1. Fetch Profile Info
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, username, created_at')
        .eq('username', username)
        .single();

      if (!profileData) {
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // 2. Fetch Likes and Ratings in parallel
      const [likesResponse, ratingsResponse] = await Promise.all([
        supabase
          .from('likes')
          .select('release_id')
          .eq('user_id', profileData.id),
        supabase
          .from('ratings')
          .select('release_id, score')
          .eq('user_id', profileData.id)
      ]);

      // 3. Process Likes
      const releaseIds = (likesResponse.data as LikeRow[] | null)?.map(l => l.release_id) ?? [];

      if (releaseIds.length > 0) {
        const { data: releases } = await supabase
          .from('releases')
          .select('*')
          .in('id', releaseIds);

        setLikedReleases((releases ?? []) as Release[]);
      }

      // 4. Process Ratings
      const ratingMap: Record<string, number> = {};
      (ratingsResponse.data as RatingRow[] | null)?.forEach(r => {
        ratingMap[r.release_id] = r.score;
      });

      setUserRatings(ratingMap);
      setLoading(false);
    };

    fetchProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600/20 border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  const isOwnProfile = user?.id === profile?.id;

  return (
    <div className="min-h-screen bg-neutral-950 pb-24 md:pb-12">
      {/* Cinematic Background Gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-gradient-to-b from-red-900/5 to-transparent" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-6 md:pt-10">
        
        {/* --- LOGO-CENTRIC PREMIUM HEADER --- */}
        <div className="relative overflow-hidden rounded-[2rem] md:rounded-[3rem] bg-neutral-900/30 border border-white/5 backdrop-blur-2xl p-6 md:p-10 mb-8 group">
          
          {isOwnProfile && (
            <button 
              onClick={handleLogout}
              className="absolute top-4 right-4 md:top-8 md:right-8 z-20 p-3 rounded-full bg-white/5 border border-white/10 text-neutral-400 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/20 transition-all active:scale-90"
              title="End Session"
            >
              <HiLogout size={20} className="md:w-6 md:h-6" />
            </button>
          )}

          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 relative z-10">
            
            {/* Red Neon Logo Container */}
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-red-600 rounded-full blur-xl opacity-10 group-hover:opacity-25 transition-opacity" />
              <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full border border-red-600/30 p-1.5 bg-neutral-950 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                <div className="relative w-full h-full rounded-full overflow-hidden">
                  <Image 
                    src="/images/logo-2.jpeg" 
                    alt="Archive Logo" 
                    fill 
                    className="object-cover" 
                  />
                </div>
              </div>
            </div>

            <div className="text-center md:text-left flex-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600/10 border border-red-600/20 text-red-500 text-[9px] font-black uppercase tracking-widest mb-3">
                <HiBadgeCheck size={12} />
                Verified Archivist
              </div>
              
              <h1 className="text-3xl md:text-5xl font-black text-white italic uppercase tracking-tighter leading-tight mb-2 truncate">
                {profile?.username}
              </h1>

              <div className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-2 text-neutral-500 text-[9px] font-bold uppercase tracking-widest">
                <div className="flex items-center gap-1.5">
                  <HiCalendar className="text-red-600" size={14} />
                  Joined {profile ? new Date(profile.created_at).getFullYear() : '2025'}
                </div>
                <div className="flex items-center gap-1.5">
                  <HiCollection className="text-red-600" size={14} />
                  {likedReleases.length} Masterpieces Saved
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- SECTION HEADER --- */}
        <div className="flex items-center justify-between mb-6 px-1">
          <div className="flex items-center gap-2">
            <div className="h-4 w-[2px] bg-red-600" />
            <h2 className="text-sm md:text-lg font-black text-white uppercase italic tracking-tight">
              Personal <span className="text-neutral-500 font-medium">Collection</span>
            </h2>
          </div>
        </div>

        {/* --- GRID --- */}
        {likedReleases.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6">
            {likedReleases.map((album) => (
              <AlbumCard 
                key={album.id} 
                album={album} 
                userRating={userRatings[album.id]} 
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 rounded-[2rem] border border-dashed border-white/5 bg-neutral-900/10">
            <HiHeart className="text-neutral-800 text-3xl mb-3" />
            <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-[0.2em]">Drive Empty</p>
          </div>
        )}
      </div>
    </div>
  );
}