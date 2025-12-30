'use client';

import { useEffect, useState, use, useRef } from 'react';
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

interface UserProfile {
  id: string;
  username: string;
  created_at: string;
  avatar_url?: string; // Added avatar_url
  favorite_album_id?: string;
  favorite_single_id?: string;
  fav_album?: Release;
  fav_single?: Release;
}

interface LikeRow { release_id: string; }
interface RatingRow { release_id: string; score: number; }

// This represents a single row from the 'likes' table join
interface LikeWithRelease {
  created_at: string;
  releases: Release | null; // Assuming Release is your existing interface
}

// If Supabase returns it as an array (sometimes happens with joins)
interface LikeWithReleaseArray {
  created_at: string;
  releases: Release[] | Release | null;
}

export default function ProfilePage({ params }: { params: Promise<{ username: string }>; }) {
  const { username } = use(params);
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { refreshProfile } = useAuth();

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

  const [activeModal, setActiveModal] = useState<'Followers' | 'Following' | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  const { error } = await supabase
    .from('profiles')
    .update({ username: newUsername })
    .eq('id', user.id);

  if (!error) {
    // 1. Update the global AuthContext state immediately
    await refreshProfile(); 

    setIsEditModalOpen(false);

    // 2. Redirect to the new URL
    if (newUsername !== profile?.username) {
      router.push(`/profile/${newUsername}`);
    } 
    // No window.location.reload() needed anymore!
  } else {
    console.error("Update failed:", error.message);
  }
  
  setIsUpdating(false);
};

const toggleFollow = async () => {
  if (!user) { router.push('/login'); return; }
  setFollowLoading(true);

  if (isFollowing) {
    // --- UNFOLLOW ---
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', profile?.id);

    if (!error) {
      setFollowerCount((prev) => prev - 1);
      setIsFollowing(false);
    }
  } else {
    // --- FOLLOW ---
    const { error: followError } = await supabase
      .from('follows')
      .insert({ follower_id: user.id, following_id: profile?.id });

    if (!followError) {
      // 1. Instant UI update
      setFollowerCount((prev) => prev + 1);
      setIsFollowing(true);

      // 2. Fetch YOUR username (the Actor) to create the link
      const { data: actorProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user?.id)
        .single();

      // 3. Create the notification for the profile owner
      await supabase.from('notifications').insert({
        user_id: profile?.id, // Person being followed
        actor_id: user.id,    // You
        type: 'follow',
        content: 'started following your archive',
        link: `/profile/${actorProfile?.username}`, // Link back to YOU
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

  const clearFavorite = async (type: 'album' | 'single') => {
    if (!user) return;
    const column = type === 'album' ? 'favorite_album_id' : 'favorite_single_id';
    await supabase.from('profiles').update({ [column]: null }).eq('id', user.id);
    window.location.reload();
  };

  useEffect(() => {
    const fetchProfile = async () => {
      // Added avatar_url to selection
      const { data: profileData } = await supabase.from('profiles').select(`id, username, created_at, avatar_url, favorite_album_id, favorite_single_id, fav_album:favorite_album_id (*), fav_single:favorite_single_id (*)`).eq('username', username).single();
      if (!profileData) { setLoading(false); return; }

      const formattedProfile: UserProfile = {
        id: profileData.id, username: profileData.username, created_at: profileData.created_at,
        avatar_url: profileData.avatar_url,
        favorite_album_id: profileData.favorite_album_id, favorite_single_id: profileData.favorite_single_id,
        fav_album: Array.isArray(profileData.fav_album) ? profileData.fav_album[0] : profileData.fav_album,
        fav_single: Array.isArray(profileData.fav_single) ? profileData.fav_single[0] : profileData.fav_single,
      };

      setProfile(formattedProfile);
      setNewUsername(formattedProfile.username);
// 1. In your Promise.all, we cast the result to our new interface
const [likesRes, ratingsRes, followersRes, followingRes, followStatusRes] = await Promise.all([
  // Index 0: Likes with Joined Releases
  supabase
    .from('likes')
    .select(`
      created_at,
      releases (*)
    `)
    .eq('user_id', profileData.id)
    .order('created_at', { ascending: false }),

  // Index 1: Ratings
  supabase
    .from('ratings')
    .select('release_id, score')
    .eq('user_id', profileData.id),

  // Index 2: Followers Count
  supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', profileData.id),

  // Index 3: Following Count
  supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', profileData.id),

  // Index 4: Current User Follow Status
  user 
    ? supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', profileData.id).maybeSingle() 
    : Promise.resolve({ data: null, error: null })
]);

// 2. Type-Safe Data Extraction (No 'any')
const rawLikes = likesRes.data as unknown as LikeWithReleaseArray[] | null;

const orderedReleases: Release[] = (rawLikes ?? [])
  .map((item) => {
    const profileData = Array.isArray(item.releases) ? item.releases[0] : item.releases;
    return profileData;
  })
  .filter((r): r is Release => r !== null);

setLikedReleases(orderedReleases);

// 3. Keep your releaseIds for the Ratings mapping (if needed elsewhere)
const releaseIds = orderedReleases.map(r => r.id);

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
             <div className="relative shrink-0">
  <div className="absolute inset-0 bg-red-600 rounded-full blur-xl opacity-10" />
  <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full border border-red-600/30 p-1.5 bg-neutral-950 overflow-hidden">
    {/* Check if avatar_url exists and is NOT the broken logo string.
      This logic ensures that if the database hasn't been cleared yet, 
      the broken image still won't show.
    */}
    {profile?.avatar_url && !profile.avatar_url.includes('logo-2.jpeg') ? (
      <Image 
        src={profile.avatar_url} 
        alt={`${profile.username}'s Identity`} 
        fill 
        className="object-cover rounded-full" 
        priority // Add priority since this is a "Hero" image for the profile
      />
    ) : (
      /* High-end Fallback Icon */
      <div className="w-full h-full flex items-center justify-center bg-neutral-900 rounded-full relative">
        {/* Subtle inner glow for the empty state */}
        <div className="absolute inset-0 bg-red-600/5 animate-pulse rounded-full" />
        <HiUserCircle size={64} className="text-neutral-800 relative z-10" />
      </div>
    )}
  </div>
</div>
            </div>
            <div className="text-center md:text-left flex-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600/10 border border-red-600/20 text-red-500 text-[9px] font-black uppercase tracking-widest mb-3">
                <HiBadgeCheck size={12} /> Verified Archivist
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white italic uppercase tracking-tighter mb-2 truncate">{profile?.username}</h1>
              
              {/* --- RESPONSIVE STATS BAR --- */}
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-y-3 gap-x-4 text-neutral-500 text-[9px] font-bold uppercase tracking-widest mt-2">
                <span className="flex items-center gap-1.5 shrink-0">
                  <HiCalendar className="text-red-600" /> Joined {profile ? new Date(profile.created_at).getFullYear() : '2025'}
                </span>
                <span className="flex items-center gap-1.5 shrink-0">
                  <HiCollection className="text-red-600" /> {likedReleases.length} Saved
                </span>
                
                {/* Social Grouping */}
                <div className="flex items-center gap-4 shrink-0 md:border-l border-white/10 md:pl-4">
                  <button
                    onClick={() => setActiveModal('Followers')}
                    className="flex items-center gap-1.5 hover:text-white transition-colors"
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6">
            {likedReleases.map((album) => <AlbumCard key={album.id} album={album} userRating={userRatings[album.id]} />)}
          </div>
        ) : <div className="py-20 text-center text-neutral-800 uppercase text-[10px] font-black tracking-widest">Drive Empty</div>}
      </div>

      {/* --- RED NEON EDIT MODAL --- */}
<AnimatePresence>
  {isEditModalOpen && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.9, y: 20 }} 
        className="relative w-full max-w-lg bg-neutral-900 border border-red-500/20 rounded-[2.5rem] flex flex-col h-[85vh] h-[85svh] md:h-auto md:max-h-[90vh] shadow-[0_0_50px_rgba(239,68,68,0.15)] overflow-hidden"
      >
        {/* --- COMPACT HEADER --- */}
        <div className="p-5 md:p-7 flex items-center justify-between border-b border-white/5 shrink-0">
          <h2 className="text-lg md:text-2xl font-black text-white italic uppercase tracking-tighter flex items-center gap-2">
            <HiPencilAlt className="text-red-600" /> Edit Profile
          </h2>
          <button onClick={() => setIsEditModalOpen(false)} className="text-neutral-500 hover:text-red-500 transition-colors">
            <HiX size={22} />
          </button>
        </div>

        {/* --- SCROLLABLE CONTENT --- */}
        <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-4 custom-scrollbar">
          
          {/* COMPRESSED AVATAR SECTION */}
          <div className="flex flex-col items-center pb-2 border-b border-white/5">
            <div className="scale-[0.85] origin-top">
              <AvatarUpload 
                currentUrl={profile?.avatar_url || null} 
                onUploadSuccess={async (newUrl) => {
                  if (profile) setProfile({ ...profile, avatar_url: newUrl || undefined });
                  if (refreshProfile) await refreshProfile(); 
                }} 
              />
            </div>
          </div>

          <div className="space-y-4">
            {/* Username Input */}
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500 ml-1">UserName</label>
              <input 
                type="text" 
                value={newUsername} 
                onChange={(e) => setNewUsername(e.target.value)} 
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-600/50" 
                placeholder="Username..." 
              />
            </div>

            {/* LETTERBOXD POSTER GRID */}
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500 ml-1">Curate Favorites</label>
              <div className="grid grid-cols-2 gap-3">
                {/* Album Slot */}
                <button 
                  type="button"
                  onClick={() => {
                    setSearchType('album');
                    searchInputRef.current?.focus(); // Focus search on click
                  }}
                  className={`relative aspect-[2/3] rounded-2xl border-2 transition-all overflow-hidden flex flex-col items-center justify-center group
                    ${searchType === 'album' ? 'border-red-600 bg-red-600/5 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'border-white/5 bg-black/40 hover:border-white/20'}`}
                >
                  {profile?.fav_album ? (
                    <Image src={profile.fav_album.cover_url || ""} alt="" fill className="object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <HiPlus size={24} className={`${searchType === 'album' ? 'text-red-500' : 'text-neutral-800'}`} />
                  )}
                  <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black via-black/80 to-transparent">
                    <p className={`text-[9px] font-black uppercase tracking-widest text-center leading-none ${searchType === 'album' ? 'text-red-500' : 'text-neutral-500'}`}>
                      {profile?.fav_album ? 'Swap Album' : 'Select Album'}
                    </p>
                  </div>
                </button>

                {/* Single Slot */}
                <button 
                  type="button"
                  onClick={() => {
                    setSearchType('single');
                    searchInputRef.current?.focus(); // Focus search on click
                  }}
                  className={`relative aspect-[2/3] rounded-2xl border-2 transition-all overflow-hidden flex flex-col items-center justify-center group
                    ${searchType === 'single' ? 'border-red-600 bg-red-600/5 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'border-white/5 bg-black/40 hover:border-white/20'}`}
                >
                  {profile?.fav_single ? (
                    <Image src={profile.fav_single.cover_url || ""} alt="" fill className="object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <HiPlus size={24} className={`${searchType === 'single' ? 'text-red-500' : 'text-neutral-800'}`} />
                  )}
                  <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black via-black/80 to-transparent">
                    <p className={`text-[9px] font-black uppercase tracking-widest text-center leading-none ${searchType === 'single' ? 'text-red-500' : 'text-neutral-500'}`}>
                      {profile?.fav_single ? 'Swap Single' : 'Select Single'}
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* SEARCH INPUT */}
            <div className="relative">
              <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input 
                ref={searchInputRef} // Attach Ref here
                type="text" 
                placeholder={`Search for ${searchType}...`} 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="w-full bg-black/40 border border-white/5 rounded-xl pl-9 pr-4 py-3 text-[11px] text-white focus:outline-none focus:border-red-600/50 font-bold placeholder:text-neutral-700" 
              />

              {/* FLOATING SEARCH RESULTS (UPWARDS) */}
              {searchResults.length > 0 && (
                <div className="absolute bottom-full left-0 w-full mb-3 bg-neutral-900 border border-white/10 rounded-[1.5rem] overflow-hidden shadow-[0_-20px_50px_rgba(0,0,0,0.8)] z-[120]">
                  {searchResults.map((result) => (
                    <button 
                      key={result.id} 
                      onClick={() => setFavorite(result.id)} 
                      className="w-full flex items-center gap-3 p-4 hover:bg-red-600/10 border-b border-white/5 last:border-none text-left group"
                    >
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/10">
                        <Image src={result.cover_url || ""} alt="" fill className="object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-white group-hover:text-red-500 transition-colors uppercase truncate">{result.title}</p>
                        <p className="text-[9px] text-neutral-500 font-bold uppercase truncate">{result.artist}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ACTIVE PINS STATUS */}
          <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1 text-[9px]">
            <p className="text-neutral-600 font-bold uppercase tracking-[0.2em]">Active Pins</p>
            <div className="flex justify-between items-center text-white italic">
              <span className="truncate max-w-[75%]">Album: {profile?.fav_album?.title || 'None'}</span>
              {profile?.fav_album && <button onClick={() => clearFavorite('album')} className="text-red-600 font-black">UNPIN</button>}
            </div>
            <div className="flex justify-between items-center text-white italic">
              <span className="truncate max-w-[75%]">Single: {profile?.fav_single?.title || 'None'}</span>
              {profile?.fav_single && <button onClick={() => clearFavorite('single')} className="text-red-600 font-black">UNPIN</button>}
            </div>
          </div>
        </div>

        {/* FIXED FOOTER */}
        <div className="p-5 md:p-8 bg-neutral-900 border-t border-white/5 shrink-0 pb-12 md:pb-8">
          <button 
            onClick={handleUpdateProfile} 
            disabled={isUpdating} 
            className="w-full py-4 bg-red-600 text-white font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-red-500 transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(239,68,68,0.2)] active:scale-95"
          >
            {isUpdating ? 'Syncing...' : <><HiCheck /> Commit Changes</>}
          </button>
        </div>
      </motion.div>
    </div>
  )}
</AnimatePresence>

      {/* --- FOLLOW/FOLLOWING MODALS --- */}
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