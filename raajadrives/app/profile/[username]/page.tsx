'use client';

import { useEffect, useState, use, useRef, useCallback } from 'react';
import { supabase } from '@/app/lib/supabase';
import Image from 'next/image';
import AlbumCard from '@/app/components/AlbumCard';
import {
  HiHeart, HiCollection, HiCalendar, HiBadgeCheck, HiLogout, HiAdjustments,
  HiX, HiCheck, HiPencilAlt, HiSearch, HiStar, HiPlus, HiCog,
  HiUserCircle
} from 'react-icons/hi';
import { Release } from '@/app/data/release';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import FollowModal from '@/app/components/FollowModal';
import AvatarUpload from '@/app/components/AvatarUpload';
import CreateCrate from '@/app/components/CreateCrate';

interface UserProfile {
  id: string;
  username: string;
  created_at: string;
  avatar_url?: string;
  favorite_album_id?: string;
  favorite_single_id?: string;
  fav_album?: Release;
  fav_single?: Release;
}

interface RatingRow { release_id: string; score: number; }

interface LikeWithReleaseArray {
  created_at: string;
  releases: Release[] | Release | null;
}

interface Crate {
  id: string;
  created_at: string;
  user_id: string;
  title: string;
  description: string | null;
  crate_id_label: string;
  is_public: boolean;
}

export default function ProfilePage({ params }: { params: Promise<{ username: string }>; }) {
  const { username } = use(params);
  const { user, signOut, loading: authLoading } = useAuth();
  const [isCrateModalOpen, setIsCrateModalOpen] = useState(false);
  const router = useRouter();
  const { refreshProfile } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [likedReleases, setLikedReleases] = useState<Release[]>([]);
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0); // Trigger for manual refreshes

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

  const [activeModal, setActiveModal] = useState<'Followers' | 'Following' | null>(null);
  const [userCrates, setUserCrates] = useState<Crate[]>([]);

  // 1. DATA FETCHING EFFECT
  useEffect(() => {
    let ignore = false; // Prevents state updates on unmounted component

    async function fetchProfileData() {
      if (!username) return;
      
      // Start loading only if not already true (avoids sync update warning on mount)
      setLoading(true);

      const { data: profileData } = await supabase
        .from('profiles')
        .select(`id, username, created_at, avatar_url, favorite_album_id, favorite_single_id, fav_album:favorite_album_id (*), fav_single:favorite_single_id (*)`)
        .eq('username', username)
        .single();

      if (ignore) return;
      if (!profileData) {
        setLoading(false);
        return;
      }

      const formattedProfile: UserProfile = {
        id: profileData.id,
        username: profileData.username,
        created_at: profileData.created_at,
        avatar_url: profileData.avatar_url,
        favorite_album_id: profileData.favorite_album_id,
        favorite_single_id: profileData.favorite_single_id,
        fav_album: Array.isArray(profileData.fav_album) ? profileData.fav_album[0] : profileData.fav_album,
        fav_single: Array.isArray(profileData.fav_single) ? profileData.fav_single[0] : profileData.fav_single,
      };

      setProfile(formattedProfile);
      setNewUsername(formattedProfile.username);

      const [likesRes, ratingsRes, followersRes, followingRes, followStatusRes, cratesRes] = await Promise.all([
        supabase.from('likes').select(`created_at, releases (*)`).eq('user_id', profileData.id).order('created_at', { ascending: false }),
        supabase.from('ratings').select('release_id, score').eq('user_id', profileData.id),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profileData.id),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profileData.id),
        user ? supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', profileData.id).maybeSingle() : Promise.resolve({ data: null, error: null }),
        supabase.from('crates').select('*').eq('user_id', profileData.id).order('created_at', { ascending: false })
      ]);

      if (ignore) return;

      const rawLikes = likesRes.data as unknown as LikeWithReleaseArray[] | null;
      const orderedReleases: Release[] = (rawLikes ?? [])
        .map((item) => Array.isArray(item.releases) ? item.releases[0] : item.releases)
        .filter((r): r is Release => r !== null);

      setLikedReleases(orderedReleases);
      setUserCrates((cratesRes.data as Crate[]) || []);

      const ratingMap: Record<string, number> = {};
      (ratingsRes.data as RatingRow[] | null)?.forEach(r => { ratingMap[r.release_id] = r.score; });
      setUserRatings(ratingMap);
      setFollowerCount(followersRes.count || 0);
      setFollowingCount(followingRes.count || 0);
      setIsFollowing(!!followStatusRes.data);
      setLoading(false);
    }

    fetchProfileData();

    return () => {
      ignore = true;
    };
  }, [username, user, refreshKey]); // re-runs when refreshKey increments

  const handleRefresh = () => {
    setIsCrateModalOpen(false);
    setRefreshKey(prev => prev + 1); // Triggers the useEffect
  };

  const handleLogout = async () => { await signOut(); router.push('/login'); };

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length < 2) { setSearchResults([]); return; }
      const { data } = await supabase.from('releases').select('*').ilike('title', `%${searchQuery}%`).eq('is_single', searchType === 'single').limit(5);
      setSearchResults((data as Release[]) || []);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchType]);

  const handleUpdateProfile = async () => {
    if (!user || !newUsername) return;
    setIsUpdating(true);
    const { error } = await supabase.from('profiles').update({ username: newUsername }).eq('id', user.id);
    if (!error) {
      await refreshProfile(); 
      setIsEditModalOpen(false);
      if (newUsername !== profile?.username) router.push(`/profile/${newUsername}`);
    } else {
      console.error("Update failed:", error.message);
    }
    setIsUpdating(false);
  };

  const toggleFollow = async () => {
    if (!user || !profile) { router.push('/login'); return; }
    setFollowLoading(true);
    if (isFollowing) {
      const { error } = await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', profile.id);
      if (!error) { setFollowerCount((prev) => prev - 1); setIsFollowing(false); }
    } else {
      const { error: followError } = await supabase.from('follows').insert({ follower_id: user.id, following_id: profile.id });
      if (!followError) {
        setFollowerCount((prev) => prev + 1);
        setIsFollowing(true);
        const { data: actorProfile } = await supabase.from('profiles').select('username').eq('id', user.id).single();
        await supabase.from('notifications').insert({
          user_id: profile.id,
          actor_id: user.id,
          type: 'follow',
          content: 'started following your archive',
          link: `/profile/${actorProfile?.username}`,
        });
      }
    }
    setFollowLoading(false);
  };

  const setFavorite = async (releaseId: string) => {
    if (!user) return;
    const column = searchType === 'album' ? 'favorite_album_id' : 'favorite_single_id';
    await supabase.from('profiles').update({ [column]: releaseId }).eq('id', user.id);
    window.location.reload();
  };

  useEffect(() => {
    if (!authLoading && !user) { router.replace('/login'); }
  }, [authLoading, user, router]);

  if (loading && !profile) {
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
              <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full border border-red-600/30 p-1.5 bg-neutral-950 overflow-hidden">
                {profile?.avatar_url && !profile.avatar_url.includes('logo-2.jpeg') ? (
                  <Image src={profile.avatar_url} alt="" fill className="object-cover rounded-full" priority />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-neutral-900 rounded-full relative">
                    <div className="absolute inset-0 bg-red-600/5 animate-pulse rounded-full" />
                    <HiUserCircle size={64} className="text-neutral-800 relative z-10" />
                  </div>
                )}
              </div>
            </div>
            <div className="text-center md:text-left flex-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600/10 border border-red-600/20 text-red-500 text-[9px] font-black uppercase tracking-widest mb-3">
                <HiBadgeCheck size={12} /> Verified Archivist
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white italic uppercase tracking-tighter mb-2 truncate">{profile?.username}</h1>
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-y-3 gap-x-4 text-neutral-500 text-[9px] font-bold uppercase tracking-widest mt-2">
                <span className="flex items-center gap-1.5 shrink-0">
                  <HiCalendar className="text-red-600" /> Joined {profile ? new Date(profile.created_at).getFullYear() : '2025'}
                </span>
                <span className="flex items-center gap-1.5 shrink-0">
                  <HiCollection className="text-red-600" /> {likedReleases.length} Saved
                </span>
                <div className="flex items-center gap-4 shrink-0 md:border-l border-white/10 md:pl-4">
                  <button onClick={() => setActiveModal('Followers')} className="flex items-center gap-1.5 hover:text-white transition-colors"><span className="text-white">{followerCount}</span> Followers</button>
                  <button onClick={() => setActiveModal('Following')} className="flex items-center gap-1.5 hover:text-white transition-colors"><span className="text-white">{followingCount}</span> Following</button>
                </div>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6 mb-20">
            {likedReleases.map((album) => <AlbumCard key={album.id} album={album} userRating={userRatings[album.id]} />)}
          </div>
        ) : <div className="py-20 text-center text-neutral-800 uppercase text-[10px] font-black tracking-widest">Drive Empty</div>}

        {/* --- ARCHIVAL CRATES SECTION --- */}
        <div className="mt-20 mb-12 px-1">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="h-4 w-[2px] bg-red-600 shadow-[0_0_8px_#dc2626]" />
              <h2 className="text-sm md:text-lg font-black text-white uppercase italic tracking-tight">Archival <span className="text-neutral-500 font-medium"> Crates</span></h2>
            </div>
           {isOwnProfile && (
            <div className="flex items-center">
              <button 
                onClick={() => setIsCrateModalOpen(true)} 
                className="
                  flex items-center gap-3 
                  text-[10px] font-black uppercase tracking-[0.3em] 
                  text-rose-600 hover:text-white 
                  transition-all duration-300 group
                "
              >
                <div className="
                  w-7 h-7 rounded-full 
                  border border-rose-600/30 
                  flex items-center justify-center 
                  group-hover:bg-rose-600 group-hover:border-rose-600 
                  transition-all duration-500
                ">
                  <HiPlus className="text-rose-600 group-hover:text-white group-hover:rotate-90 transition-transform duration-500" />
                </div>
                
                <span className="relative">
                  Create New Crate
                  <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-rose-600 group-hover:w-full transition-all duration-500" />
                </span>
              </button>

              <CreateCrate 
                  isOpen={isCrateModalOpen} 
                  onClose={() => setIsCrateModalOpen(false)} 
                  onRefresh={handleRefresh} 
              />
            </div>
          )}
          </div>

        {userCrates.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {userCrates.map((crate) => (
              <motion.button 
                key={crate.id} 
                onClick={() => router.push(`/crates/${crate.id}`)} 
                className="group relative flex flex-col p-4 sm:p-7 bg-gradient-to-b from-neutral-950/80 to-black/70 border-2 border-neutral-700/60 rounded-2xl sm:rounded-[2.5rem] hover:border-orange-500/70 hover:shadow-[0_0_40px_rgba(255,165,0,0.3)] hover:translate-y-[-4px] transition-all backdrop-blur-xl overflow-hidden hover:backdrop-blur-[12px]"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-transparent to-red-500/10 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <div className="relative mb-4 sm:mb-8">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-black/95 to-neutral-900 border-[3px] sm:border-4 border-neutral-600 shadow-[0_0_25px_rgba(0,0,0,0.8)] mx-auto relative overflow-hidden group-hover:shadow-[0_0_35px_rgba(255,165,0,0.4)] transition-all">
                    <div className="absolute inset-1.5 rounded-full opacity-70 bg-[repeating-radial-gradient(circle,transparent_0px,transparent_1px,#444_3px,#333_5px)]" />
                    <div className="absolute inset-0 rounded-full opacity-30 bg-[conic-gradient(from_0deg,#555_0deg,transparent_180deg)] animate-[spin_15s_linear_infinite]" />
                    <div className="absolute inset-0 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500/90 to-red-600/90 border-2 sm:border-3 border-white/40 shadow-[0_0_25px_rgba(255,165,0,0.6)]">
                      <Image src="/images/crate-logo.jpeg" alt="Crate Logo" width={96} height={96} className="w-4/5 h-4/5 object-contain rounded-full" priority />
                    </div>
                  </div>
                </div>
                <div className="flex-1 flex flex-col">
                  <h4 className="text-white text-sm sm:text-xl font-black uppercase italic tracking-tight mb-1 sm:mb-3 group-hover:text-orange-400 transition-colors line-clamp-1">{crate.title}</h4>
                  <p className="text-neutral-400 text-[10px] sm:text-sm line-clamp-1 sm:line-clamp-2 mb-3 sm:mb-6 font-medium uppercase tracking-wide leading-relaxed group-hover:text-neutral-300 transition-colors">{crate.description || 'Freshly pressed.'}</p>
                  <div className="mt-auto pt-3 sm:pt-5 border-t border-white/10 flex justify-between items-center text-[8px] sm:text-xs font-black uppercase tracking-[0.25em] text-neutral-500">
                    <span className="hidden xs:inline">Spins Hot</span>
                    <HiCog size={12} className="text-orange-500 group-hover:animate-spin transition-all" />
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="py-16 sm:py-20 text-center border-2 border-dashed border-neutral-700/50 rounded-2xl sm:rounded-[3rem] bg-neutral-950/50 backdrop-blur-sm">
            <p className="text-neutral-500 uppercase font-black tracking-[0.3em] text-sm sm:text-base mb-4">Empty Record Bin</p>
            <p className="text-xs sm:text-sm text-neutral-600 uppercase font-medium tracking-wider mb-6">Stack your first crate</p>
          </div>
        )}
        </div>
      </div>

      {/* --- EDIT MODAL --- */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-lg bg-neutral-900 border border-red-500/20 rounded-[2.5rem] flex flex-col h-[85vh] md:h-auto md:max-h-[90vh] shadow-[0_0_50px_rgba(239,68,68,0.15)] overflow-hidden">
              <div className="p-5 md:p-7 flex items-center justify-between border-b border-white/5 shrink-0">
                <h2 className="text-lg md:text-2xl font-black text-white italic uppercase tracking-tighter flex items-center gap-2"><HiPencilAlt className="text-red-600" /> Edit Profile</h2>
                <button onClick={() => setIsEditModalOpen(false)} className="text-neutral-500 hover:text-red-500"><HiX size={22} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-4">
                <AvatarUpload currentUrl={profile?.avatar_url || null} onUploadSuccess={async (newUrl) => { if (profile) setProfile({ ...profile, avatar_url: newUrl || undefined }); await refreshProfile(); }} />
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500 ml-1">UserName</label>
                  <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-600/50" />
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setSearchType('album')} className={`relative aspect-[2/3] rounded-2xl border-2 ${searchType === 'album' ? 'border-red-600' : 'border-white/5'}`}>
                      {profile?.fav_album ? <Image src={profile.fav_album.cover_url || ""} alt="" fill className="object-cover opacity-60" /> : <HiPlus className="m-auto text-neutral-800" />}
                    </button>
                    <button onClick={() => setSearchType('single')} className={`relative aspect-[2/3] rounded-2xl border-2 ${searchType === 'single' ? 'border-red-600' : 'border-white/5'}`}>
                      {profile?.fav_single ? <Image src={profile.fav_single.cover_url || ""} alt="" fill className="object-cover opacity-60" /> : <HiPlus className="m-auto text-neutral-800" />}
                    </button>
                  </div>
                  <input type="text" placeholder={`Search for ${searchType}...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white" />
                  {searchResults.length > 0 && (
                    <div className="bg-neutral-800 rounded-xl overflow-hidden">
                      {searchResults.map(res => (
                        <button key={res.id} onClick={() => setFavorite(res.id)} className="w-full p-3 text-left hover:bg-red-600/20 text-xs text-white uppercase font-bold">{res.title}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="p-5 md:p-8 bg-neutral-900 border-t border-white/5">
                <button onClick={handleUpdateProfile} disabled={isUpdating} className="w-full py-4 bg-red-600 text-white font-black uppercase tracking-[0.3em] rounded-2xl shadow-xl">{isUpdating ? 'Syncing...' : 'Commit Changes'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- FOLLOW MODALS --- */}
      {profile?.id && <FollowModal isOpen={!!activeModal} onClose={() => setActiveModal(null)} title={activeModal || 'Followers'} profileId={profile.id} />}
    </div>
  );
}