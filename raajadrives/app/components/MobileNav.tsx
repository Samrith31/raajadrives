'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HiHome, 
  HiSearch, 
  HiCollection, 
  HiUser, 
  HiLightningBolt,
 HiMusicNote,
  HiSparkles 
} from 'react-icons/hi';
import { useAuth } from '@/app/context/AuthContext';

export default function MobileNav() {
  const pathname = usePathname();
 const { user, username } = useAuth();

 const profileHref = user 
  ? (username ? `/profile/${username}` : `/profile/id-${user.id}`) 
  : '/login';

  const navItems = [
    { label: 'Home', href: '/', icon: HiHome },
    { label: 'Latest', href: '/latest', icon: HiMusicNote}, // Combined search/archive
    { label: 'Feed', href: '/activity', icon: HiLightningBolt }, // YOUR NEW FEED
    { label: 'Match', href: '/discovery', icon: HiSparkles }, // YOUR NEW DISCOVERY
  { 
  label: 'Profile', 
  href: profileHref, 
  icon: HiUser 
},
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] px-4 pb-6 pt-2 pointer-events-none">
      <div className="max-w-md mx-auto flex items-center justify-around bg-neutral-900/80 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-2 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] pointer-events-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center w-14 h-14 transition-all duration-300"
            >
              {/* Active Indicator Glow */}
              {isActive && (
                <div className="absolute inset-0 bg-red-600/10 rounded-full blur-xl animate-pulse" />
              )}
              
              <Icon 
                size={22} 
                className={`relative z-10 transition-all duration-300 ${
                  isActive ? 'text-red-600 scale-110' : 'text-neutral-500 hover:text-neutral-300'
                }`} 
              />
              
              <span className={`text-[8px] font-black uppercase tracking-tighter mt-1 transition-all duration-300 ${
                isActive ? 'text-white opacity-100' : 'text-neutral-600 opacity-0'
              }`}>
                {item.label}
              </span>

              {/* Red Dot for Active */}
              {isActive && (
                <div className="absolute -bottom-1 w-1 h-1 bg-red-600 rounded-full shadow-[0_0_8px_#ef4444]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}