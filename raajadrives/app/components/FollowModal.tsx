'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';
import { HiX, HiSparkles } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';

// --- STRICT INTERFACES ---

interface ProfileData {
  id: string;
  username: string;
}

// Defines the nested structure returned by the Supabase join
interface FollowResponse {
  profiles: ProfileData | ProfileData[] | null;
}

interface FollowUser {
  id: string;
  username: string;
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

      // Explicitly cast the data response to avoid 'any'
      const { data, error } = await supabase
        .from('follows')
        .select(`
          profiles:${columnToSelect} (id, username)
        `)
        .eq(columnToMatch, profileId) as { data: FollowResponse[] | null, error: Error | null };

      if (!error && data) {
        const cleanedUsers = data
          .map((item: FollowResponse) => {
            // Flatten logic: handle if Supabase returns an array or an object
            const p = item.profiles;
            return Array.isArray(p) ? p[0] : p;
          })
          // Type Guard: Filter out nulls and prove to TS that the result is FollowUser[]
          .filter((u): u is FollowUser => u !== null);
        
        setUsers(cleanedUsers);
      }
      setLoading(false);
    };

    fetchList();
  }, [isOpen, title, profileId]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          {/* Overlay */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-neutral-950/90 backdrop-blur-md cursor-pointer"
          />
          
          {/* Modal Container */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-neutral-900 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
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

            {/* Content List */}
            <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-hide">
              {loading ? (
                <div className="py-20 flex justify-center">
                  <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : users.length > 0 ? (
                users.map((u) => (
                  <Link 
                    key={u.id} 
                    href={`/profile/${u.username}`} 
                    onClick={onClose}
                    className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl transition-all group"
                  >
                    <div className="relative w-10 h-10 rounded-full border border-white/10 overflow-hidden shrink-0 bg-neutral-800">
                      <Image 
                        src="/images/logo-2.jpeg" 
                        alt={u.username} 
                        fill 
                        className="object-cover" 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white group-hover:text-red-500 transition-colors truncate">
                        {u.username}
                      </p>
                      <p className="text-[10px] text-neutral-500 uppercase tracking-tighter">Archivist</p>
                    </div>
                    <HiSparkles className="text-red-600/20 group-hover:text-red-600 transition-all duration-300" size={16} />
                  </Link>
                ))
              ) : (
                <div className="py-20 text-center text-neutral-600 text-[10px] uppercase font-black tracking-[0.3em]">
                  Empty Network
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}