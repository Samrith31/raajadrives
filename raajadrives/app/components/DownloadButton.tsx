'use client';

import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';

interface DownloadButtonProps {
  downloadUrl: string;
}

export default function DownloadButton({ downloadUrl }: DownloadButtonProps) {
  const { user, loading } = useAuth();

  // 1. Loading State (Prevents button flickering)
  if (loading) {
    return (
      <div className="w-full py-6 bg-white/5 border border-white/10 rounded-2xl animate-pulse flex items-center justify-center">
        <div className="h-4 w-32 bg-white/20 rounded-full" />
      </div>
    );
  }

  // 2. Logged Out State
  if (!user) {
    return (
      <Link
        href="/login"
        className="group relative flex items-center justify-center w-full py-6 bg-red-600 text-white font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-red-700 transition-all duration-300 shadow-[0_0_40px_rgba(220,38,38,0.2)]"
      >
        <span className="relative z-10">Login to Download</span>
      </Link>
    );
  }

  // 3. Logged In State (Original Design)
  return (
    <Link
      href={downloadUrl}
      target="_blank"
      className="group relative flex items-center justify-center w-full py-6 bg-white text-black font-black uppercase tracking-[0.3em] rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.1)] overflow-hidden"
    >
      <span className="relative z-10 group-hover:text-white transition-colors duration-500">
        Download Lossless
      </span>
      <div className="absolute inset-0 bg-red-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
    </Link>
  );
}