'use client';

import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { HiLockClosed, HiDownload, HiHeart, HiStar, HiCheckCircle } from 'react-icons/hi';

interface DownloadButtonProps {
  downloadUrl: string;
  isLiked: boolean;
  isRated: boolean;
}

export default function DownloadButton({ downloadUrl, isLiked, isRated }: DownloadButtonProps) {
  const { user, loading } = useAuth();

  // The Decryption Key: All three must be true
  const isUnlocked = user && isLiked && isRated;

  // 1. LOADING STATE
  if (loading) {
    return (
      <div className="w-full py-6 bg-white/5 border border-white/10 rounded-2xl animate-pulse flex items-center justify-center">
        <div className="h-4 w-32 bg-white/10 rounded-full" />
      </div>
    );
  }

  // 2. LOGGED OUT STATE
  if (!user) {
    return (
      <Link
        href="/login"
        className="group relative flex flex-col items-center justify-center w-full py-8 bg-neutral-900 border border-white/5 rounded-3xl hover:border-red-600 transition-all duration-500"
      >
        <HiLockClosed className="mb-3 text-red-600 animate-pulse" size={24} />
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Login Required</span>
        <span className="text-[8px] font-bold text-neutral-600 uppercase tracking-widest mt-2">Signup or Login to Download</span>
      </Link>
    );
  }

  // 3. LOGGED IN BUT LOCKED (Needs Like and Rate)
  if (!isUnlocked) {
    return (
      <div className="relative w-full p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden">
        <div className="relative z-10 flex flex-col items-center">
          <div className="flex items-center gap-8 mb-6">
            {/* Requirement 01: Like */}
            <div className={`flex flex-col items-center gap-2 transition-all duration-700 ${isLiked ? 'text-red-500' : 'text-neutral-800'}`}>
              <div className={`p-3 rounded-full border ${isLiked ? 'border-red-500/20 bg-red-500/10' : 'border-white/5'}`}>
                {isLiked ? <HiCheckCircle size={20} /> : <HiHeart size={20} />}
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest">Like Unlocked</span>
            </div>

            <div className="h-10 w-[1px] bg-white/5" />

            {/* Requirement 02: Rate */}
            <div className={`flex flex-col items-center gap-2 transition-all duration-700 ${isRated ? 'text-yellow-500' : 'text-neutral-800'}`}>
              <div className={`p-3 rounded-full border ${isRated ? 'border-yellow-500/20 bg-yellow-500/10' : 'border-white/5'}`}>
                {isRated ? <HiCheckCircle size={20} /> : <HiStar size={20} />}
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest">Rate Unlocked</span>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em] italic mb-1">
              File Encryption Active
            </p>
            <p className="text-[9px] font-bold text-neutral-700 uppercase tracking-widest">
              Like and Rate to Download
            </p>
          </div>
        </div>

        {/* Background Decryption Grid Aesthetic */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none flex items-center justify-center">
           <span className="text-8xl font-black italic uppercase tracking-tighter">Encrypted</span>
        </div>
      </div>
    );
  }

  // 4. UNLOCKED STATE (The Actual Button)
  return (
    <Link
      href={downloadUrl}
      target="_blank"
      className="group relative flex items-center justify-between w-full p-6 bg-white text-black rounded-[2rem] hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 shadow-[0_20px_60px_rgba(255,255,255,0.05)] overflow-hidden"
    >
      <div className="relative z-10 flex flex-col items-start">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[11px] font-black uppercase tracking-[0.3em] group-hover:text-white transition-colors duration-500">
            Success
          </span>
        </div>
        <span className="text-[10px] font-bold italic opacity-40 group-hover:text-white/60 transition-colors duration-500 ml-3.5">
          Download Losseless
        </span>
      </div>

      <div className="relative z-10 h-12 w-12 bg-black/5 rounded-full flex items-center justify-center group-hover:bg-white/20 group-hover:text-white transition-all duration-500">
        <HiDownload size={24} />
      </div>

      {/* Hover Background Slide */}
      <div className="absolute inset-0 bg-red-600 translate-y-full group-hover:translate-y-0 transition-transform duration-700 ease-in-out" />
    </Link>
  );
}