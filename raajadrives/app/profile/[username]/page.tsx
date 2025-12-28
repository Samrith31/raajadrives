'use client';

import { useEffect, useState, use } from 'react';
import { supabase } from '@/app/lib/supabase';
import Image from 'next/image';
import AlbumCard from '@/app/components/AlbumCard';
import {
  HiHeart, HiCollection, HiCalendar, HiBadgeCheck, HiLogout, HiAdjustments,
  HiX, HiCheck, HiPencilAlt, HiSearch, HiStar, HiPlus
} from 'react-icons/hi';
import { Release } from '@/app/data/release';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import FollowModal from '@/app/components/FollowModal';

interface UserProfile {
  id: string;
  username: string;
  created_at: string;
  favorite_album_id?: string;
  favorite_single_id?: string;
  fav_album?: Release;
  fav_single?: Release;
}

interface LikeRow { release_id: string; }
interface RatingRow { release_id: string; score: number; }

export default function ProfilePage({ params }: { params: Promise<{ username: string }>; }) {
  const { username } = use(params);
  const { user, signOut } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [likedReleases, setLikedReleases] = useState<Release[]>([]);
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Social Stats States
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Modal & Search States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Release[]>([]);
  const [searchType, setSearchType] = useState<'album' | 'single'>('album');

  //follow and following

  const [activeModal, setActiveModal] = useState<'Followers' | 'Following' | null>(null);

  const handleLogout = async () => { await signOut(); router.push('/login'); };

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length < 2) { setSearchResults([]); return; }
      const { data } = await supabase.from('releases').select('*').ilike('title', `%${searchQuery}%`).eq('type', searchType).limit(5);
      setSearchResults((data as Release[]) || []);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchType]);

  const handleUpdateProfile = async () => {
    if (!user || !newUsername) return;
    setIsUpdating(true);
    const { error } = await supabase.from('profiles').update({ username: newUsername }).eq('id', user.id);
    if (!error) {
      setIsEditModalOpen(false);
      if (newUsername !== profile?.username) router.push(`/profile/${newUsername}`);
      else window.location.reload();
    }
    setIsUpdating(false);
  };

  const toggleFollow = async () => {
    if (!user) { router.push('/login'); return; }
    setFollowLoading(true);
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', profile?.id);
      setFollowerCount(prev => prev - 1);
      setIsFollowing(false);
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: profile?.id });
      setFollowerCount(prev => prev + 1);
      setIsFollowing(true);
    }
    setFollowLoading(false);
  };

  const setFavorite = async (releaseId: string) => {
    if (!user) return;
    const column = searchType === 'album' ? 'favorite_album_id' : 'favorite_single_id';
    await supabase.from('profiles').update({ [column]: releaseId }).eq('id', user.id);
    window.location.reload();
  };

  const clearFavorite = async (type: 'album' | 'single') => {
    if (!user) return;
    const column = type === 'album' ? 'favorite_album_id' : 'favorite_single_id';
    await supabase.from('profiles').update({ [column]: null }).eq('id', user.id);
    window.location.reload();
  };

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: profileData } = await supabase.from('profiles').select(`id, username, created_at, favorite_album_id, favorite_single_id, fav_album:favorite_album_id (*), fav_single:favorite_single_id (*)`).eq('username', username).single();
      if (!profileData) { setLoading(false); return; }

      const formattedProfile: UserProfile = {
        id: profileData.id, username: profileData.username, created_at: profileData.created_at,
        favorite_album_id: profileData.favorite_album_id, favorite_single_id: profileData.favorite_single_id,
        fav_album: Array.isArray(profileData.fav_album) ? profileData.fav_album[0] : profileData.fav_album,
        fav_single: Array.isArray(profileData.fav_single) ? profileData.fav_single[0] : profileData.fav_single,
      };

      setProfile(formattedProfile);
      setNewUsername(formattedProfile.username);

      const [likesRes, ratingsRes, followersRes, followingRes, followStatusRes] = await Promise.all([
        supabase.from('likes').select('release_id').eq('user_id', profileData.id),
        supabase.from('ratings').select('release_id, score').eq('user_id', profileData.id),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profileData.id),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profileData.id),
        user ? supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', profileData.id).maybeSingle() : Promise.resolve({ data: null })
      ]);

      const releaseIds = (likesRes.data as LikeRow[] | null)?.map(l => l.release_id) ?? [];
      if (releaseIds.length > 0) {
        const { data: releases } = await supabase.from('releases').select('*').in('id', releaseIds);
        setLikedReleases((releases ?? []) as Release[]);
      }

      const ratingMap: Record<string, number> = {};
      (ratingsRes.data as RatingRow[] | null)?.forEach(r => { ratingMap[r.release_id] = r.score; });
      setUserRatings(ratingMap);
      setFollowerCount(followersRes.count || 0);
      setFollowingCount(followingRes.count || 0);
      setIsFollowing(!!followStatusRes.data);
      setLoading(false);
    };
    fetchProfile();
  }, [username, user]);

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
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-gradient-to-b from-red-900/5 to-transparent" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-6 md:pt-10">
        {/* --- HEADER --- */}
        <div className="relative overflow-hidden rounded-[2rem] md:rounded-[3rem] bg-neutral-900/30 border border-white/5 backdrop-blur-2xl p-6 md:p-10 mb-8">
          {isOwnProfile ? (
            <div className="absolute top-4 right-4 md:top-8 md:right-8 z-20 flex flex-row max-[420px]:flex-col gap-2">
              <button onClick={() => setIsEditModalOpen(true)} className="p-3 rounded-full bg-white/5 border border-white/10 text-neutral-400 hover:text-red-500 hover:bg-red-500/10 transition-all"><HiAdjustments size={20} /></button>
              <button onClick={handleLogout} className="p-3 rounded-full bg-white/5 border border-white/10 text-neutral-400 hover:text-red-500 hover:bg-red-500/10 transition-all"><HiLogout size={20} /></button>
            </div>
          ) : (
            <button 
              onClick={toggleFollow}
              disabled={followLoading}
              className={`absolute top-4 right-4 md:top-8 md:right-8 z-20 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all
                ${isFollowing ? 'bg-white/5 border border-white/10 text-neutral-400' : 'bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:scale-105'}`}
            >
              {isFollowing ? 'Unfollow' : 'Follow'}
            </button>
          )}

          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 relative z-10">
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-red-600 rounded-full blur-xl opacity-10" />
              <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full border border-red-600/30 p-1.5 bg-neutral-950">
                <Image src="/images/logo-2.jpeg" alt="Logo" fill className="object-cover rounded-full" />
              </div>
            </div>
            <div className="text-center md:text-left flex-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600/10 border border-red-600/20 text-red-500 text-[9px] font-black uppercase tracking-widest mb-3">
                <HiBadgeCheck size={12} /> Verified Archivist
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white italic uppercase tracking-tighter mb-2 truncate">{profile?.username}</h1>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-neutral-500 text-[9px] font-bold uppercase tracking-widest mt-2">
                <span className="flex items-center gap-1.5"><HiCalendar className="text-red-600" /> Joined {profile ? new Date(profile.created_at).getFullYear() : '2025'}</span>
                <span className="flex items-center gap-1.5"><HiCollection className="text-red-600" /> {likedReleases.length} Saved</span>
               <button
  onClick={() => setActiveModal('Followers')}
  className="flex items-center gap-1.5 border-l border-white/10 pl-4 hover:text-white transition-colors"
>
  <span className="text-white">{followerCount}</span>
  <span>Followers</span>
</button>

<button
  onClick={() => setActiveModal('Following')}
  className="flex items-center gap-1.5 hover:text-white transition-colors"
>
  <span className="text-white">{followingCount}</span>
  <span>Following</span>
</button>

              </div>
            </div>
          </div>
        </div>

        {/* --- MASTERPIECE SPOTLIGHT --- */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6 px-1">
            <div className="h-3 w-[2px] bg-red-600" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50">Favorite <span className="text-white">Raaja&apos;s</span></h3>
          </div>
          <div className="grid grid-cols-2 gap-3 md:gap-6">
            {/* Album Slot */}
            <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4 group rounded-2xl bg-neutral-900/40 border border-white/5 p-2 md:p-3 hover:bg-neutral-900/60 transition-all backdrop-blur-sm overflow-hidden">
              <div className="relative aspect-square w-full md:w-24 shrink-0 rounded-lg overflow-hidden border border-white/10 shadow-2xl bg-neutral-950">
                {profile?.fav_album ? <Image src={profile.fav_album.cover_url || '/images/logo-2.jpeg'} alt="Fav Album" fill className="object-cover group-hover:scale-110 transition-transform duration-700" /> : <button onClick={() => isOwnProfile && setIsEditModalOpen(true)} className="w-full h-full flex items-center justify-center text-neutral-700 hover:text-red-500"><HiPlus size={22} /></button>}
                <div className="absolute top-2 right-2 w-1 h-1 rounded-full bg-red-600 shadow-[0_0_8px_#ef4444] animate-pulse" />
              </div>
              <div className="flex-1 min-w-0 text-center md:text-left pb-2 md:pb-0">
                <p className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-red-500 mb-1 italic">Favorite Album</p>
                <h4 className="text-[10px] md:text-base font-bold text-white truncate leading-tight mb-0.5">{profile?.fav_album?.title || "Assign Album"}</h4>
              </div>
            </div>
            {/* Single Slot */}
            <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4 group rounded-2xl bg-neutral-900/40 border border-white/5 p-2 md:p-3 hover:bg-neutral-900/60 transition-all backdrop-blur-sm overflow-hidden">
              <div className="relative aspect-square w-full md:w-24 shrink-0 rounded-lg overflow-hidden border border-white/10 shadow-2xl bg-neutral-950">
                {profile?.fav_single ? <Image src={profile.fav_single.cover_url || '/images/logo-2.jpeg'} alt="Fav Single" fill className="object-cover group-hover:scale-110 transition-transform duration-700" /> : <button onClick={() => isOwnProfile && setIsEditModalOpen(true)} className="w-full h-full flex items-center justify-center text-neutral-700 hover:text-amber-500"><HiPlus size={22} /></button>}
                <div className="absolute top-2 right-2 w-1 h-1 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b] animate-pulse" />
              </div>
              <div className="flex-1 min-w-0 text-center md:text-left pb-2 md:pb-0">
                <p className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-amber-500 mb-1 italic">Favorite Single</p>
                <h4 className="text-[10px] md:text-base font-bold text-white truncate leading-tight mb-0.5">{profile?.fav_single?.title || "Assign Single"}</h4>
              </div>
            </div>
          </div>
        </div>

        {/* --- COLLECTION GRID --- */}
        <div className="flex items-center justify-between mb-6 px-1">
          <div className="flex items-center gap-2">
            <div className="h-4 w-[2px] bg-red-600" />
            <h2 className="text-sm md:text-lg font-black text-white uppercase italic tracking-tight">Personal <span className="text-neutral-500 font-medium"> Archive</span></h2>
          </div>
        </div>
        {likedReleases.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6">
            {likedReleases.map((album) => <AlbumCard key={album.id} album={album} userRating={userRatings[album.id]} />)}
          </div>
        ) : <div className="py-20 text-center text-neutral-800 uppercase text-[10px] font-black tracking-widest">Drive Empty</div>}
      </div>

      {/* --- RED NEON MODAL --- */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-lg bg-neutral-900 border border-red-500/20 rounded-[2.5rem] p-8 shadow-[0_0_50px_rgba(239,68,68,0.15)]">
              <button onClick={() => setIsEditModalOpen(false)} className="absolute top-6 right-6 text-neutral-500 hover:text-red-500 transition-colors"><HiX size={24} /></button>
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-8 flex items-center gap-3"><HiPencilAlt className="text-red-600" /> Edit <span className="text-neutral-500 font-medium text-sm mt-1">Profile</span></h2>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 ml-2">UserName</label>
                  <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="w-full bg-black/60 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-red-600/50" placeholder="Enter new username..." />
                </div>
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex gap-2">
                    {['album', 'single'].map((type) => (
                      <button key={type} onClick={() => setSearchType(type as 'album' | 'single')} className={`flex-1 py-2 text-[8px] font-black uppercase tracking-[0.2em] rounded-lg border transition-all ${searchType === type ? 'bg-red-600 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-white/5 border-white/5 text-neutral-500 hover:border-white/10'}`}>Pin {type}</button>
                    ))}
                  </div>
                  <div className="relative">
                    <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input type="text" placeholder={`Search ${searchType}s...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-black/60 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:border-red-600/50" />
                    {searchResults.length > 0 && (
                      <div className="absolute z-[110] w-full mt-2 bg-neutral-900 border border-white/10 rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                        {searchResults.map((result) => (
                          <button key={result.id} onClick={() => setFavorite(result.id)} className="w-full flex items-center gap-3 p-3 hover:bg-red-600/10 border-b border-white/5 last:border-none group">
                            <div className="relative w-10 h-10 rounded-md overflow-hidden shrink-0 border border-white/5"><Image src={result.cover_url || '/images/logo-2.jpeg'} alt="" fill className="object-cover" /></div>
                            <div className="text-left truncate">
                              <p className="text-[11px] font-bold text-white group-hover:text-red-500 transition-colors">{result.title}</p>
                              <p className="text-[9px] text-neutral-500 uppercase tracking-tighter">{result.artist}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3 text-xs">
                   <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-[0.2em]">Live Pins</p>
                   <div className="flex justify-between items-center"><span className="text-neutral-400">Album: <span className="text-white italic">{profile?.fav_album?.title || 'None'}</span></span>{profile?.fav_album && <button onClick={() => clearFavorite('album')} className="text-[9px] font-black uppercase text-red-600">Unpin</button>}</div>
                   <div className="flex justify-between items-center"><span className="text-neutral-400">Single: <span className="text-white italic">{profile?.fav_single?.title || 'None'}</span></span>{profile?.fav_single && <button onClick={() => clearFavorite('single')} className="text-[9px] font-black uppercase text-red-600">Unpin</button>}</div>
                </div>
                <button onClick={handleUpdateProfile} disabled={isUpdating} className="w-full py-5 bg-red-600 text-white font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-red-500 hover:scale-[1.02] transition-all shadow-[0_0_30px_rgba(239,68,68,0.2)]">{isUpdating ? 'Syncing...' : <><HiCheck /> Commit Changes</>}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

{profile?.id && (
  <FollowModal
    isOpen={!!activeModal}
    onClose={() => setActiveModal(null)}
    title={activeModal || 'Followers'}
    profileId={profile.id}
  />
)}



      
    </div>

    
  );

  
}