'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/app/lib/supabase';
import { useAuth } from '@/app/context/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
import { HiUsers, HiPlus, HiCheck, HiSparkles, HiMusicNote, HiSearch, HiX, HiUserCircle } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';

interface ArchivistProfile {
  id: string;
  username: string;
  avatar_url: string | null; // Added avatar_url
  follower_count: number;
  is_following: boolean;
  common_count: number;
}

export default function DiscoveryPage() {
  const { user } = useAuth();
  const [archivists, setArchivists] = useState<ArchivistProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // 1. Helper updated to handle avatar_url
  const enrichProfiles = useCallback(async (profiles: { id: string, username: string, avatar_url: string | null }[], matchCounts?: Record<string, number>) => {
    if (!user) return [];
    
    return await Promise.all(
      profiles.map(async profile => {
        const [followersRes, followStatus] = await Promise.all([
          supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.id),
          supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', profile.id).maybeSingle(),
        ]);

        return {
          id: profile.id,
          username: profile.username,
          avatar_url: profile.avatar_url, // Map from the database result
          follower_count: followersRes.count || 0,
          is_following: !!followStatus.data,
          common_count: matchCounts ? matchCounts[profile.id] || 0 : 0,
        };
      })
    );
  }, [user]);

  // 2. Main Logic
  useEffect(() => {
    if (!user) { setLoading(false); return; }

    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        if (searchQuery.trim()) {
          setIsSearching(true);
          const { data: results } = await supabase
            .from('profiles')
            .select('id, username, avatar_url') // Added avatar_url
            .ilike('username', `%${searchQuery}%`)
            .neq('id', user.id)
            .limit(15);

          if (isMounted && results) {
            const enriched = await enrichProfiles(results);
            setArchivists(enriched);
          }
        } else {
          setIsSearching(false);
          const { data: myLikes } = await supabase.from('likes').select('release_id').eq('user_id', user.id);
          
          if (!myLikes || myLikes.length === 0) {
            if (isMounted) setArchivists([]);
            return;
          }

          const myReleaseIds = myLikes.map(l => l.release_id);
          const { data: othersLikes } = await supabase
            .from('likes')
            .select('user_id')
            .in('release_id', myReleaseIds)
            .neq('user_id', user.id)
            .limit(500);

          if (!othersLikes || othersLikes.length === 0) {
            if (isMounted) setArchivists([]);
            return;
          }

          const matchCount: Record<string, number> = {};
          othersLikes.forEach(like => {
            matchCount[like.user_id] = (matchCount[like.user_id] || 0) + 1;
          });

          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username, avatar_url') // Added avatar_url
            .in('id', Object.keys(matchCount));

          if (isMounted && profiles) {
            const enriched = await enrichProfiles(profiles, matchCount);
            enriched.sort((a, b) => b.common_count - a.common_count);
            setArchivists(enriched.slice(0, 15));
          }
        }
      } catch (err) {
        console.error("Discovery Error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const timer = setTimeout(() => fetchData(), searchQuery ? 400 : 0);
    return () => { isMounted = false; clearTimeout(timer); };
  }, [user, searchQuery, enrichProfiles]);

  const handleFollow = async (targetId: string, isFollowing: boolean) => {
    if (!user) return;
    setFollowLoading(targetId);
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetId);
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: targetId });
    }
    setArchivists(prev => prev.map(a => a.id === targetId ? { ...a, is_following: !isFollowing, follower_count: isFollowing ? a.follower_count - 1 : a.follower_count + 1 } : a));
    setFollowLoading(null);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
   <div className="min-h-screen bg-neutral-950 pt-6 md:pt-24 pb-12 px-4">

      <div className="max-w-5xl mx-auto">
        <div className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-6 w-[3px] bg-red-600 shadow-[0_0_10px_#dc2626]" />
                <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
                 {isSearching ? 'Manual' : "Match "}
                 <span className="text-neutral-500">{isSearching ? 'Search' : 'Vibe'}</span>
                 {!isSearching && <HiSparkles className="text-red-500 animate-pulse" />}
                </h1>
              </div>
              <p className="text-neutral-500 text-[9px] font-bold uppercase tracking-[0.2em] ml-4">
                {isSearching ? `showing results for "${searchQuery}"` : 'discovering archivists with similar taste'}
              </p>
            </div>
            <div className="relative group w-full md:w-80">
              <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-red-600 transition-colors" />
              <input 
                type="text"
                placeholder="Find archivist..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-900/40 border border-white/5 rounded-2xl py-3 pl-10 pr-10 text-xs font-bold text-white focus:outline-none focus:border-red-600/40 transition-all placeholder:text-neutral-700"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-white">
                  <HiX size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {archivists.length > 0 ? (
              archivists.map(a => (
                <motion.div key={a.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="relative p-8 rounded-[3rem] bg-neutral-900/20 border border-white/5 hover:border-red-600/20 transition-all duration-500"
                >
                  {a.common_count > 0 && (
                    <div className="absolute top-6 right-6 flex items-center gap-1 px-3 py-1 rounded-full bg-red-600/10 border border-red-600/20">
                      <HiMusicNote className="text-red-500" size={12} />
                      <span className="text-[10px] font-black text-red-500 uppercase tracking-tighter">{a.common_count} shared</span>
                    </div>
                  )}
                  <div className="flex flex-col items-center text-center">
                    {/* UPDATED AVATAR BOX */}
                    <div className="relative w-24 h-24 rounded-full border-2 border-red-600/10 p-1.5 mb-6 group bg-neutral-950 overflow-hidden">
                      {a.avatar_url ? (
                        <Image 
                          src={a.avatar_url} 
                          alt={a.username} 
                          fill 
                          unoptimized={true}
                          className="object-cover rounded-full grayscale group-hover:grayscale-0 transition-all duration-700" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-neutral-900 rounded-full">
                          <HiUserCircle size={60} className="text-neutral-800" />
                        </div>
                      )}
                    </div>

                    <Link href={`/profile/${a.username}`} className="text-xl font-black text-white hover:text-red-500 transition-colors uppercase tracking-tight">{a.username}</Link>
                    <p className="mt-2 text-[9px] text-neutral-600 font-bold uppercase tracking-widest"><HiUsers className="inline mr-1 text-red-600/40" />{a.follower_count} followers</p>
                    <button onClick={() => handleFollow(a.id, a.is_following)} disabled={followLoading === a.id}
                      className={`mt-6 w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all ${a.is_following ? 'bg-white/5 border border-white/10 text-neutral-500 hover:text-red-500' : 'bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.2)] hover:scale-[1.02]'}`}
                    >
                      {followLoading === a.id ? '...' : a.is_following ? <><HiCheck /> Connected</> : <><HiPlus /> Follow</>}
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-24 text-center rounded-[3rem] border border-dashed border-white/5 bg-neutral-900/10">
                <HiMusicNote className="mx-auto text-neutral-800 mb-6" size={56} />
                <p className="text-neutral-400 text-[11px] font-black uppercase tracking-[0.3em]">{isSearching ? 'No Archivist Found' : 'No Frequency Match'}</p>
                <p className="text-neutral-700 text-[9px] mt-3 uppercase max-w-sm mx-auto">{isSearching ? 'try a different username' : 'like more albums to unlock taste twins'}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}