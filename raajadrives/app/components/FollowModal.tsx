'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';
import { HiX, HiSparkles, HiUserCircle } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';

// --- UPDATED STRICT INTERFACES ---

interface ProfileData {
  id: string;
  username: string;
  avatar_url: string | null; // Added avatar_url
}

// Defines the nested structure returned by the Supabase join
interface FollowResponse {
  profiles: ProfileData | ProfileData[] | null;
}

// The flattened, clean user object we use in the UI
interface FollowUser {
  id: string;
  username: string;
  avatar_url: string | null; // Added avatar_url
}

interface FollowModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: 'Followers' | 'Following';
  profileId: string;
}

export default function FollowModal({ isOpen, onClose, title, profileId }: FollowModalProps) {
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const fetchList = async () => {
      setLoading(true);
      
      const columnToMatch = title === 'Followers' ? 'following_id' : 'follower_id';
      const columnToSelect = title === 'Followers' ? 'follower_id' : 'following_id';

      // Updated query to fetch avatar_url
      const { data, error } = await supabase
        .from('follows')
        .select(`
          profiles:${columnToSelect} (id, username, avatar_url)
        `)
        .eq(columnToMatch, profileId) as unknown as { data: FollowResponse[] | null, error: Error | null };

      if (!error && data) {
        const cleanedUsers = data
          .map((item: FollowResponse) => {
            // Flatten logic: handle if Supabase returns an array or an object
            const p = item.profiles;
            // Ensure we get the first item if it's an array, or the item itself
            return Array.isArray(p) ? p[0] : p;
          })
          // Type Guard: Filter out nulls and prove to TS that the result is FollowUser[]
          .filter((u): u is FollowUser => u !== null && u !== undefined);
        
        setUsers(cleanedUsers);
      }
      setLoading(false);
    };

    fetchList();
  }, [isOpen, title, profileId]);

  return (
    <AnimatePresence>
      {isOpen && (
        // 1. Outer container with padding to prevent touching screen edges on mobile
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6 sm:py-12 h-screen">
          
          {/* Overlay */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-neutral-950/90 backdrop-blur-md cursor-pointer"
          />
          
          {/* 2. Modal Container: Fixed max width/height, flex column layout */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-[28rem] max-h-full flex flex-col bg-neutral-900 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_-12px_rgba(220,38,38,0.3)]"
          >
            {/* Header: shrink-0 ensures it doesn't collapse */}
            <div className="shrink-0 p-6 border-b border-white/5 flex items-center justify-between bg-neutral-900 z-10">
              <div className="flex items-center gap-3">
                <div className="h-4 w-[2px] bg-red-600 shadow-[0_0_10px_#dc2626]" />
                <h2 className="text-sm font-black text-white uppercase tracking-widest italic">{title}</h2>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-white/5 rounded-full text-neutral-500 transition-colors"
                aria-label="Close modal"
              >
                <HiX size={20} />
              </button>
            </div>

            {/* 3. Content List: flex-1 takes remaining space, overflow handles scrolling */}
            <div className="flex-1 overflow-y-auto p-2 scrollbar-hide custom-scrollbar">
              {loading ? (
                <div className="h-40 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : users.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {users.map((u) => (
                    <Link 
                      key={u.id} 
                      href={`/profile/${u.username}`} 
                      onClick={onClose}
                      className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-all group"
                    >
                      {/* 4. Dynamic Avatar with Fallback */}
                      <div className="relative w-10 h-10 rounded-full border border-white/10 overflow-hidden shrink-0 bg-neutral-800 flex items-center justify-center group-hover:border-red-500/50 transition-colors">
                        {u.avatar_url ? (
                          <Image 
                            src={u.avatar_url} 
                            alt={u.username} 
                            fill 
                            sizes="40px"
                            className="object-cover" 
                          />
                        ) : (
                          <HiUserCircle size={24} className="text-neutral-600 group-hover:text-neutral-400 transition-colors" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white group-hover:text-red-500 transition-colors truncate">
                          {u.username}
                        </p>
                        {/* Optional: Could show follower count here if fetched */}
                        <p className="text-[10px] text-neutral-500 uppercase tracking-tighter">View Profile</p>
                      </div>
                      <HiSparkles className="text-neutral-800 group-hover:text-red-600 transition-all duration-300 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0" size={14} />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-neutral-600 text-[10px] uppercase font-black tracking-[0.3em]">
                  Empty List
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}