'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  HiHome,
  HiLightningBolt,
  HiMusicNote,
  HiSparkles,
  HiUser,
} from 'react-icons/hi';
import { useAuth } from '@/app/context/AuthContext';

export default function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, username, loading } = useAuth();

  const navItems = [
    { label: 'Home', href: '/', icon: HiHome },
    { label: 'Latest', href: '/latest', icon: HiMusicNote },
    { label: 'Feed', href: '/activity', icon: HiLightningBolt },
    { label: 'Match', href: '/discovery', icon: HiSparkles },
    { label: 'Profile', href: '/profile', icon: HiUser },
  ];

  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault();

    if (loading) return; // block click during auth sync

    if (user && username) {
      router.push(`/profile/${username}`);
    } else {
      router.push('/login');
    }
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] px-4 pb-6 pt-2 pointer-events-none">
      <div className="max-w-md mx-auto flex items-center justify-around bg-neutral-900/80 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-2 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] pointer-events-auto">
        {navItems.map((item) => {
          const isActive =
            item.label === 'Profile'
              ? pathname.startsWith('/profile')
              : pathname === item.href;

          const Icon = item.icon;
          const isProfile = item.label === 'Profile';

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={isProfile ? handleProfileClick : undefined}
              className={`relative flex flex-col items-center justify-center w-14 h-14 transition-all duration-300 ${
                loading && isProfile ? 'opacity-60 pointer-events-none' : ''
              }`}
            >
              {isActive && (
                <div className="absolute inset-0 bg-red-600/10 rounded-full blur-xl animate-pulse" />
              )}

              <Icon
                size={22}
                className={`relative z-10 transition-all duration-300 ${
                  isActive
                    ? 'text-red-600 scale-110'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              />

              <span
                className={`text-[8px] font-black uppercase tracking-tighter mt-1 transition-all duration-300 ${
                  isActive
                    ? 'text-white opacity-100'
                    : 'text-neutral-600 opacity-0'
                }`}
              >
                {item.label}
              </span>

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
