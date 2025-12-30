'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/app/lib/supabase';
import { useAuth } from '@/app/context/AuthContext';
import { HiBell, HiUserAdd, HiDatabase } from 'react-icons/hi';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// ... (Interface stays the same)
interface NotificationWithActor {
  id: string;
  created_at: string;
  user_id: string;
  actor_id: string | null;
  type: 'follow' | 'upload';
  content: string;
  link: string | null;
  is_read: boolean;
  actor: {
    username: string;
  } | null;
}

export default function NotificationCenter() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationWithActor[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);
  
  const isFetching = useRef(false);
  // ✅ 1. ADD REF FOR CLICK DETECTION
  const containerRef = useRef<HTMLDivElement>(null);

  // ✅ 2. CLICK-AWAY LOGIC
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // (Stabilized fetch logic stays the same)
  const fetchInitial = useCallback(async () => {
    if (!user || isFetching.current) return;
    isFetching.current = true;
    try {
      const { data: logs } = await supabase
        .from('notifications')
        .select(`id, created_at, user_id, actor_id, type, content, link, is_read, actor:profiles!actor_id ( username )`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      setNotifications((logs as unknown as NotificationWithActor[]) || []);
      setUnreadCount(count || 0);
    } catch (err) {
      console.error('Notification Sync Error:', err);
    } finally {
      isFetching.current = false;
    }
  }, [user]);

  useEffect(() => {
    fetchInitial();
    if (!user) return;
    const channel = supabase
      .channel(`user-alerts-${user.id}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, 
        (payload) => {
          const newNotif = payload.new as NotificationWithActor;
          setNotifications(prev => [newNotif, ...prev].slice(0, 5));
          setUnreadCount(prev => prev + 1);
          if (navigator.vibrate) navigator.vibrate(10);
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchInitial]);

  const toggleDropdown = async () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState && unreadCount > 0) {
      setUnreadCount(0);
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user?.id);
    }
  };

  if (!user) return null;

  return (
    // ✅ 3. WRAP EVERYTHING IN THE REF
    <div className="relative inline-block" ref={containerRef}>
      <button 
        onClick={toggleDropdown} 
        className="relative p-2 text-neutral-400 hover:text-white transition-all active:scale-90"
      >
        <HiBell size={24} />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span 
              initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-black"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed inset-x-0 top-auto mt-3 mx-auto w-[90vw] max-w-sm
  md:absolute md:inset-x-auto md:right-0 md:mx-0 md:w-80
  bg-[#0a0a0a] border border-white/10 rounded-2xl
  shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100]
  overflow-hidden backdrop-blur-xl"
          >
            {/* ... Dropdown content stays exactly the same ... */}
            <div className="p-4 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Your Notifications</span>
              <span className="text-[8px] font-mono text-red-600 animate-pulse uppercase tracking-widest">Live</span>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <Link key={n.id} href={n.link || '/notifications'} onClick={() => setIsOpen(false)} className="flex items-start gap-4 p-4 hover:bg-white/[0.03] border-b border-white/[0.02] transition-colors group">
                    <div className="mt-1 text-neutral-600 group-hover:text-red-500 transition-colors">
                      {n.type === 'follow' ? <HiUserAdd size={18} /> : <HiDatabase size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-neutral-300 leading-snug">
                        <span className="font-bold text-white uppercase tracking-tighter mr-1 italic">{n.actor?.username || 'ARCHIVE'}</span>
                        {n.content}
                      </p>
                      <p className="text-[8px] font-mono text-neutral-700 mt-1 uppercase tracking-widest">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-10 text-center"><p className="text-[10px] font-black uppercase tracking-widest text-neutral-800 italic">No incoming data</p></div>
              )}
            </div>
            <Link href="/notifications" onClick={() => setIsOpen(false)} className="block p-3 text-center text-[9px] font-black uppercase tracking-[0.3em] text-neutral-500 hover:text-white hover:bg-white/5 border-t border-white/5">
              SEE ALL
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}