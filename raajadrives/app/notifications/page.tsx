'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/app/lib/supabase';
import { useAuth } from '@/app/context/AuthContext';
import { HiUserAdd, HiDatabase, HiCheckCircle, HiTrash, HiOutlineBell } from 'react-icons/hi';
import Link from 'next/link';

// Interface remains the same
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
    avatar_url: string | null;
  } | null;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationWithActor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`id, created_at, user_id, actor_id, type, content, link, is_read, actor:profiles!actor_id ( username, avatar_url )`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications((data as unknown as NotificationWithActor[]) || []);
    } catch (err) {
      console.error('Archive Sync Error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAllRead = async () => {
    if (!user) return;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id);
    
    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  };

  const deleteNotification = async (id: string) => {
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (!error) {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center">
      <div className="w-8 h-8 border-2 border-t-red-600 rounded-full animate-spin mb-4" />
      <span className="text-[10px] font-black uppercase tracking-[0.5em] text-neutral-800 italic">Syncing_Logs...</span>
    </div>
  );

  return (
   <div className="min-h-screen bg-[#050505] text-white pt-8 md:pt-32 pb-10 px-4 md:px-6 relative isolate">

      {/* Background Ambience */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,_#111_0%,_transparent_50%)]" />

      <div className="max-w-4xl mx-auto">
        
        {/* Header Section - Adjusted margins for mobile height */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 border-b border-white/5 pb-6 md:pb-10">
          <div>
            <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter mb-1">Logs</h1>
            <p className="text-[9px] font-bold text-red-600/50 uppercase tracking-[0.4em] flex items-center gap-2">
              <span className="w-1 h-1 bg-red-600 rounded-full animate-pulse" />
              {notifications.length} Entries Detected
            </p>
          </div>
          
          <button 
            onClick={markAllRead}
            disabled={notifications.every(n => n.is_read)}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl md:rounded-full text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-30"
          >
            <HiCheckCircle className="text-green-500" size={16} />
            Clear All
          </button>
        </div>

        {/* Notifications List */}
        <div className="space-y-2 md:space-y-3">
          {notifications.length > 0 ? (
            notifications.map((n) => (
              <div 
                key={n.id}
                className={`group relative flex items-center gap-4 md:gap-6 p-4 md:p-6 rounded-xl md:rounded-2xl border transition-all duration-500 ${
                  !n.is_read 
                  ? 'bg-red-600/[0.03] border-red-600/20 shadow-[0_0_40px_rgba(220,38,38,0.02)]' 
                  : 'bg-white/[0.01] border-white/5 hover:border-white/20'
                }`}
              >
                {/* 1. Icon Type - Scaled down for mobile */}
                <div className={`p-3 md:p-4 rounded-lg md:rounded-xl transition-colors ${!n.is_read ? 'bg-red-600/10 text-red-500' : 'bg-white/5 text-neutral-800'}`}>
                  {n.type === 'follow' ? <HiUserAdd size={18} className="md:w-[22px]" /> : <HiDatabase size={18} className="md:w-[22px]" />}
                </div>

                {/* 2. Content Body */}
                <div className="flex-1 min-w-0">
                  <Link href={n.link || '#'} className="block group/link">
                    <p className={`text-sm md:text-lg leading-tight mb-0.5 transition-colors ${!n.is_read ? 'text-white font-bold' : 'text-neutral-500 font-medium group-hover/link:text-neutral-300'}`}>
                      <span className="text-red-600 uppercase font-black tracking-tighter mr-1 italic">
                        {n.actor?.username || 'SYSTEM'}
                      </span>
                      {n.content}
                    </p>
                    <span className="text-[8px] font-mono text-neutral-700 uppercase tracking-widest">
                      {new Date(n.created_at).toLocaleDateString()} • {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </Link>
                </div>

                {/* 3. Action Toolbar - Visible by default on mobile for easier touch */}
                <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => deleteNotification(n.id)}
                    className="p-2 text-neutral-800 hover:text-red-600 transition-colors"
                  >
                    <HiTrash size={18} />
                  </button>
                </div>

                {/* Unread Indicator Dot */}
                {!n.is_read && (
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-1 h-1 bg-red-600 rounded-full animate-pulse" />
                )}
              </div>
            ))
          ) : (
            <div className="py-20 md:py-40 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-[2rem] md:rounded-[3rem]">
              <HiOutlineBell className="text-neutral-900 mb-4" size={48} />
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-neutral-800 italic text-center px-4">Vault is clean. No recent logs.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}