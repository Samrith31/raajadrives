'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';
import { HiX, HiUserCircle, HiUserAdd, HiUserRemove } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';

/* ---------- STRICT INTERFACES ---------- */

interface ProfileData {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface FollowUser extends ProfileData {
  isFollowing?: boolean;
}

// This matches the structure of the joined query profiles:columnToSelect (...)
interface FollowQueryResult {
  profiles: ProfileData | ProfileData[] | null;
}

interface FollowModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: 'Followers' | 'Following';
  profileId: string;
}

/* ---------- COMPONENT ---------- */

export default function FollowModal({ isOpen, onClose, title, profileId }: FollowModalProps) {
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

/* ---------- UPDATED FETCH LOGIC ONLY ---------- */

useEffect(() => {
  if (!isOpen) return;

  const fetchListAndStatus = async () => {
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);

    const columnToMatch = title === 'Followers' ? 'following_id' : 'follower_id';
    const columnToSelect = title === 'Followers' ? 'follower_id' : 'following_id';

    const { data, error } = await supabase
      .from('follows')
      .select(`
        created_at, 
        profiles:${columnToSelect} (id, username, avatar_url)
      `)
      .eq(columnToMatch, profileId)
      // Sorting by created_at ensures the latest follow comes first
      .order('created_at', { ascending: false });

    if (!error && data) {
      const rawData = data as unknown as (FollowQueryResult & { created_at: string })[];
      
      const cleanedUsers: ProfileData[] = rawData
        .map((item) => (Array.isArray(item.profiles) ? item.profiles[0] : item.profiles))
        .filter((p): p is ProfileData => p !== null);

      if (user) {
        const { data: followingData } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id);
        
        const followingIds = new Set(followingData?.map(f => f.following_id));
        
        setUsers(cleanedUsers.map((u) => ({
          ...u,
          isFollowing: followingIds.has(u.id)
        })));
      } else {
        setUsers(cleanedUsers);
      }
    }
    setLoading(false);
  };

  fetchListAndStatus();
}, [isOpen, title, profileId]);

  const toggleFollow = async (targetUserId: string, isCurrentlyFollowing: boolean) => {
    if (!currentUserId) return;

    // Optimistic UI update
    setUsers(prev => prev.map(u => 
      u.id === targetUserId ? { ...u, isFollowing: !isCurrentlyFollowing } : u
    ));

    if (isCurrentlyFollowing) {
      await supabase.from('follows')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId);
    } else {
      await supabase.from('follows')
        .insert({ follower_id: currentUserId, following_id: targetUserId });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6 h-[100dvh]">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="absolute inset-0 bg-neutral-950/90 backdrop-blur-md cursor-pointer" 
          />
          
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 10 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.95, opacity: 0, y: 10 }} 
            className="relative w-full max-w-[22rem] max-h-[60vh] flex flex-col bg-neutral-900 border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="shrink-0 p-4 border-b border-white/5 flex items-center justify-between bg-neutral-900">
              <div className="flex items-center gap-2">
                <div className="h-3 w-[2px] bg-red-600 shadow-[0_0_8px_#dc2626]" />
                <h2 className="text-[11px] font-black text-white uppercase tracking-widest italic">{title}</h2>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-white/5 rounded-full text-neutral-500">
                <HiX size={18} />
              </button>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
              {loading ? (
                <div className="h-32 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : users.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {users.map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-all group">
                      <Link href={`/profile/${u.username}`} onClick={onClose} className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="relative w-8 h-8 rounded-full border border-white/10 overflow-hidden shrink-0 bg-neutral-800 flex items-center justify-center">
                          {u.avatar_url ? (
                            <Image src={u.avatar_url} alt={u.username} fill sizes="32px" className="object-cover" />
                          ) : (
                            <HiUserCircle size={20} className="text-neutral-600" />
                          )}
                        </div>
                        <p className="text-[12px] font-bold text-white truncate">{u.username}</p>
                      </Link>

                      {currentUserId !== u.id && (
                        <button 
                          onClick={() => toggleFollow(u.id, !!u.isFollowing)}
                          className={`p-2 rounded-lg transition-all ${
                            u.isFollowing 
                              ? 'text-red-500 bg-red-500/10 hover:bg-red-500/20' 
                              : 'text-neutral-400 bg-white/5 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {u.isFollowing ? <HiUserRemove size={16} /> : <HiUserAdd size={16} />}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center text-neutral-600 text-[9px] uppercase font-black tracking-[0.2em]">
                  Empty
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}