'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/app/lib/supabase';
import { useAuth } from '@/app/context/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
import { HiStar, HiUsers, HiLightningBolt, HiBadgeCheck, HiUserCircle, HiChatAlt2 } from 'react-icons/hi';
import { motion } from 'framer-motion'; // Make sure the path is correct
import PostCreatorModal from '@/app/components/PostCreator';

// --- UPDATED INTERFACES ---
// Nested Join Types
interface ProfileData {
  username: string;
  avatar_url: string | null;
}

interface ReleaseData {
  title: string;
  artist: string;
  cover_url: string;
  slug: string;
  type: string;
}

// Raw Response Shapes
interface RatingRawResponse {
  id: string;
  created_at: string;
  score: number;
  profiles: ProfileData | null;
  releases: ReleaseData | null;
}

interface PostRawResponse {
  id: string;
  created_at: string;
  content: string;
  profiles: ProfileData | null;
  releases: ReleaseData | null;
}

// Final Formatted Item
interface ActivityItem {
  id: string;
  created_at: string;
  type: 'rating' | 'post';
  score?: number;
  content?: string;
  username: string;
  avatar_url: string | null;
  release: ReleaseData;
}
export default function ActivityPage() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
    if (diffInSeconds < 60) return 'now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const fetchActivity = useCallback(async () => {
  if (!user) return;
  
  try {
    const { data: following } = await supabase.from('follows').select('following_id').eq('follower_id', user.id);
    const followedIds = following?.map(f => f.following_id) ?? [];
    const allTargetIds = [...followedIds, user.id];

    // 1. Fetch Ratings with explicit typing
    const ratingsPromise = supabase
      .from('ratings')
      .select(`
        id, created_at, score, 
        profiles!user_id(username, avatar_url), 
        releases!release_id(title, artist, cover_url, slug, type)
      `)
      .in('user_id', allTargetIds)
      .gte('score', 4)
      .order('created_at', { ascending: false })
      .limit(15);

    // 2. Fetch Posts with explicit typing
    const postsPromise = supabase
      .from('posts')
      .select(`
        id, created_at, content, 
        profiles!user_id(username, avatar_url), 
        releases!release_id(title, artist, cover_url, slug, type)
      `)
      .in('user_id', allTargetIds)
      .order('created_at', { ascending: false })
      .limit(15);

    const [ratingsRes, postsRes] = await Promise.all([ratingsPromise, postsPromise]);

    // 3. Format Ratings
    const formattedRatings: ActivityItem[] = (ratingsRes.data as unknown as RatingRawResponse[] || [])
      .filter(r => r.profiles && r.releases) // Safety check for null joins
      .map((r) => ({
        id: r.id,
        created_at: r.created_at,
        type: 'rating',
        score: r.score,
        username: r.profiles!.username,
        avatar_url: r.profiles!.avatar_url,
        release: r.releases!
      }));

    // 4. Format Posts
    const formattedPosts: ActivityItem[] = (postsRes.data as unknown as PostRawResponse[] || [])
      .filter(p => p.profiles && p.releases) // Safety check for null joins
      .map((p) => ({
        id: p.id,
        created_at: p.created_at,
        type: 'post',
        content: p.content,
        username: p.profiles!.username,
        avatar_url: p.profiles!.avatar_url,
        release: p.releases!
      }));

    const combined = [...formattedRatings, ...formattedPosts].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setActivities(combined.slice(0, 25));
  } catch (error) {
    console.error("Archive Sync Error:", error);
  } finally {
    setLoading(false);
  }
}, [user]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-950 pt-6 sm:pt-24 pb-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        
        {/* --- HEADER --- */}
        <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
          <div className="flex items-center gap-3">
            <div className="h-6 w-[3px] bg-red-600 shadow-[0_0_10px_#dc2626]" />
            <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter">
              Maestro&apos;s <span className="ml-3 text-neutral-500 font-medium italic">Feed</span>
            </h1>
          </div>
          <HiLightningBolt className="text-red-600 animate-pulse" size={24} />
        </div>

        {/* --- NEW POST CREATOR --- */}
   <PostCreatorModal onPostCreated={fetchActivity} />


        {activities.length > 0 ? (
          <div className="flex flex-col gap-10 md:gap-16">
            {activities.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.5 }}
                className="group bg-neutral-900/30 border border-white/5 rounded-[2rem] p-5 md:p-6 hover:border-red-600/30 transition-all duration-500 shadow-2xl"
              >
                {/* 1. Header: Archivist Identity */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-neutral-800 shrink-0 p-0.5 bg-neutral-950 group-hover:border-red-600/50 transition-colors">
                    {item.avatar_url ? (
                      <Image src={item.avatar_url} alt={item.username} fill className="object-cover rounded-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-neutral-800">
                        <HiUserCircle size={28} className="text-neutral-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Link href={`/profile/${item.username}`} className="text-sm font-black text-white uppercase tracking-tight hover:text-red-500 transition-colors truncate">
                        {item.username}
                      </Link>
                      <HiBadgeCheck className="text-red-600 shrink-0 drop-shadow-[0_0_5px_rgba(220,38,38,0.5)]" size={16} />
                    </div>
                    {/* Dynamic Status Text */}
                    <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest mt-0.5">
                    {item.type === 'post'
  ? 'Shared a Post'
  : `Logged a ${item.release.type === 'single' ? 'Single' : 'Album'}`
}

                    </p>
                  </div>
                  <div className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.15em] tabular-nums">
                    {formatRelativeTime(item.created_at)}
                  </div>
                </div>

                {/* 2. Post Text (If type is post) */}
                {item.type === 'post' && item.content && (
                  <div className="mb-6 px-1">
                   <p className="
  text-white text-lg font-medium leading-relaxed tracking-tight
  whitespace-pre-wrap
  break-words
  overflow-wrap-anywhere
">
  {item.content}
</p>

                  </div>
                )}

                {/* 3. The Artwork */}
                <Link 
                  href={`/${item.release.type === 'single' ? 'single' : 'flac'}/${item.release.slug}`}
                  className="relative block w-full aspect-square rounded-2xl overflow-hidden border border-white/5 bg-neutral-950 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] group-hover:shadow-[0_20px_40px_-15px_rgba(220,38,38,0.2)] transition-all duration-500"
                >
                  <Image
                    src={item.release.cover_url || '/images/logo-2.jpeg'}
                    alt={item.release.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                  {/* Subtle "Attached" tag for posts */}
                  {item.type === 'post' && (
                    <div className="absolute top-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full">
                       <span className="text-[8px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                         <HiChatAlt2 className="text-red-600" /> Linked Entry
                       </span>
                    </div>
                  )}
                </Link>

                {/* 4. Rating Stars (Only show if type is rating) */}
                {item.type === 'rating' && item.score && (
                  <div className="mt-5 px-1 flex items-center gap-1.5">
                    {Array.from({ length: 5 }).map((_, starIndex) => {
                      const isLit = (starIndex + 1) <= Math.floor(item.score!);
                      return (
                        <HiStar 
                          key={starIndex} 
                          size={20} 
                          className={`${isLit ? "text-red-600 drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]" : "text-neutral-800"} transition-colors duration-300`}
                        />
                      );
                    })}
                  </div>
                )}

                {/* 5. Release Info */}
              <div className={`mt-3 px-1 ${item.type === 'post' ? 'pt-2' : ''}`}>
  <Link href={`/${item.release.type === 'single' ? 'single' : 'flac'}/${item.release.slug}`}>
    <h2 className="text-xl md:text-2xl font-black text-white leading-tight uppercase truncate group-hover:text-red-600 transition-colors">
      {item.release.title}
    </h2>
  <p
  className={`text-sm md:text-base font-medium uppercase truncate tracking-tighter mt-1
    ${item.type === 'post' ? 'text-red-500' : 'text-neutral-400'}
  `}
>
  {item.release.artist}
</p>

  </Link>

  {/* Render ONLY for album/single logs */}
  {item.type !== 'post' && (
    <div className="flex items-center gap-2 mt-4">
      <div className="h-[2px] w-6 bg-red-600" />
      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-red-500 italic">
        {item.username} Logged
      </span>
    </div>
  )}
</div>

              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-32 text-center rounded-[3rem] border border-dashed border-white/5 bg-neutral-900/10">
            <HiUsers className="mx-auto text-neutral-800 mb-4 opacity-50" size={48} />
            <p className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.2em]">Feed Unlinked</p>
            <p className="text-neutral-700 text-[9px] mt-2 uppercase">Follow more archivists to see their logs.</p>
          </div>
        )}
      </div>
    </div>
  );
}