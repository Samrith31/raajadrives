// components/MobileNav.tsx

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HiHome, HiFolder, HiMusicNote } from 'react-icons/hi';

export default function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', href: '/', icon: <HiHome size={24} /> },
    { label: 'FLAC', href: '/flac', icon: <HiMusicNote size={24} /> },
    { label: 'CD Rips', href: '/cdrips', icon: <HiFolder size={24} /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-neutral-950 border-t border-white/10 md:hidden">
      <ul className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`flex flex-col items-center text-xs transition-colors ${
                pathname === item.href ? 'text-red-500' : 'text-neutral-400'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
