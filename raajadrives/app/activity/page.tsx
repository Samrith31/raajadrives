'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import { useAuth } from '@/app/context/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
// Import HiStar for the icons
import { HiStar, HiUsers, HiLightningBolt, HiBadgeCheck } from 'react-icons/hi';
import { motion } from 'framer-motion';

// --- INTERFACES (Unchanged) ---
interface ActivityResponse {
  id: string;
  created_at: string;
  score: number;
  profiles: { username: string } | null;
  releases: { 
    title: string; 
    artist: string; 
    cover_url: string; 
    slug: string; 
    type: string 
  } | null;
}

interface ActivityItem {
  id: string;
  created_at: string;
  score: number;
  username: string;
  release: {
    title: string;
    artist: string;
    cover_url: string;
    slug: string;
    type: string;
  };
}

export default function ActivityPage() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  // --- FETCH LOGIC (Unchanged) ---
  useEffect(() => {
    if (!user) return;
    const fetchActivity = async () => {
      const { data: following } = await supabase.from('follows').select('following_id').eq('follower_id', user.id);
      const followedIds = following?.map(f => f.following_id) ?? [];
      if (followedIds.length === 0) { setLoading(false); return; }

      const { data, error } = await supabase
        .from('ratings')
        .select(`id, created_at, score, profiles!user_id(username), releases!release_id(title, artist, cover_url, slug, type)`)
        .in('user_id', followedIds)
        .gte('score', 4)
        .order('created_at', { ascending: false })
        .limit(20) as { data: ActivityResponse[] | null; error: Error | null };

      if (data && !error) {
        const formattedData: ActivityItem[] = data
          .filter(item => item.profiles && item.releases)
          .map(item => ({
            id: item.id,
            created_at: item.created_at,
            score: item.score,
            username: item.profiles!.username,
            release: {
              title: item.releases!.title,
              artist: item.releases!.artist,
              cover_url: item.releases!.cover_url,
              slug: item.releases!.slug,
              type: item.releases!.type,
            },
          }));
        setActivities(formattedData);
      }
      setLoading(false);
    };
    fetchActivity();
  }, [user]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-950 pt-24 pb-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        
        {/* --- HEADER --- */}
        <div className="flex items-center justify-between mb-12 border-b border-white/5 pb-6">
          <div className="flex items-center gap-3">
            <div className="h-6 w-[3px] bg-red-600 shadow-[0_0_10px_#dc2626]" />
         <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter">
 Maestro&apos;s
  <span className="ml-3 text-neutral-500 font-medium italic">Feed</span>
</h1>


          </div>
          <HiLightningBolt className="text-red-600 animate-pulse" size={24} />
        </div>

        {activities.length > 0 ? (
          /* --- POSTS LOOP --- */
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
                     <Image src="/images/logo-2.jpeg" alt="" fill className="object-cover rounded-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Link href={`/profile/${item.username}`} className="text-sm font-black text-white uppercase tracking-tight hover:text-red-500 transition-colors truncate">
                        {item.username}
                      </Link>
                      <HiBadgeCheck className="text-red-600 shrink-0 drop-shadow-[0_0_5px_rgba(220,38,38,0.5)]" size={16} />
                    </div>
                  </div>
                  <div className="text-[9px] text-neutral-500 font-bold uppercase whitespace-nowrap tracking-widest">
                    {new Date(item.created_at).toLocaleDateString()}
                  </div>
                </div>

                {/* 2. The Artwork (Clean, no badge inside) */}
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
                </Link>

                {/* --- NEW: INDIVIDUAL ICON STARS (Outside the artwork) --- */}
                <div className="mt-5 px-1 flex items-center gap-1.5">
                  {/* Dynamically generate 5 stars */}
                  {Array.from({ length: 5 }).map((_, starIndex) => {
                    // Calculate if this star should be lit based on the score.
                    // Using Math.floor checks if the integer part of the score covers this star position.
                    const isLit = (starIndex + 1) <= Math.floor(item.score);
                    
                    return (
                      <HiStar 
                        key={starIndex} 
                        size={20} 
                        className={`${isLit ? "text-red-600 drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]" : "text-neutral-800"} transition-colors duration-300`}
                      />
                    );
                  })}
                </div>

                {/* 3. Footer: Release Info */}
                <div className="mt-3 px-1">
                  <Link href={`/${item.release.type === 'single' ? 'single' : 'flac'}/${item.release.slug}`}>
                    <h2 className="text-xl md:text-2xl font-black text-white leading-tight uppercase truncate group-hover:text-red-600 transition-colors">
                      {item.release.title}
                    </h2>
                    <p className="text-sm md:text-base text-neutral-400 font-medium uppercase truncate tracking-tighter mt-1">
                      {item.release.artist}
                    </p>
                  </Link>
                  
                   <div className="flex items-center gap-2 mt-4">
                     <div className="h-[2px] w-6 bg-red-600" />
                     <span className="text-[9px] font-black uppercase tracking-[0.2em] text-red-500 italic">{item.username} Logged</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          /* --- EMPTY STATE --- */
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