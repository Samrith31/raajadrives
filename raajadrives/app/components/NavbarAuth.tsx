'use client';

import { useAuth } from '@/app/context/AuthContext';
import Link from 'next/link';
import { HiUserCircle, HiLogout } from 'react-icons/hi';

export default function NavbarAuth() {
  const { user, username, signOut, loading } = useAuth();

  // Show nothing while checking if the user is logged in to prevent flickering
  if (loading) return <div className="w-20 h-8 bg-white/5 animate-pulse rounded-full" />;

  if (user) {
    return (
      <div className="flex items-center gap-4">
        {/* User Card */}
            <Link href={`/profile/${username}`} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-red-500/50 transition-all">
    <HiUserCircle className="text-red-500 text-lg" />
    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white italic">
        {username || 'Member'}
    </span>
    </Link>
        
        {/* Logout Button */}
        <button 
          onClick={signOut}
          className="p-1.5 text-neutral-500 hover:text-red-500 transition-colors bg-white/5 rounded-lg border border-white/5 hover:border-red-500/30"
          title="Logout"
        >
          <HiLogout size={16} />
        </button>
      </div>
    );
  }

  // If No User, Show Join Button
  return (
    <Link 
      href="/signup" 
      className="px-5 py-2 text-[10px] font-black uppercase tracking-widest bg-white text-black rounded-full hover:bg-red-600 hover:text-white transition-all hover:scale-105 active:scale-95 shadow-lg shadow-white/5"
    >
      Join Drive
    </Link>
  );
}