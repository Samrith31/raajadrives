'use client';

import { useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { HiUser, HiLockClosed, HiArrowRight } from 'react-icons/hi';

export default function LoginPage() {
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch the email associated with the username from your profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', usernameInput.trim())
        .single();

      if (profileError || !profile) {
        throw new Error('Username not found in the archive.');
      }

      // 2. Authenticate using the retrieved email
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password,
      });

      if (authError) throw authError;

      // --- SUCCESS BLOCK: HARD REDIRECT ---
      if (!authError && data.user) {
        setLoading(false);
        // Using window.location.href instead of router.push
        // This is the most reliable way to stay logged in on a refresh.
        window.location.href = '/'; 
      }
      
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected authentication error occurred.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glow - Mirroring the SignUp Page */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/10 blur-[120px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md bg-neutral-900/50 backdrop-blur-xl border border-white/10 p-8 md:p-12 rounded-[2.5rem] shadow-2xl"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-16 h-16 rounded-full border-2 border-red-600 p-1 mb-4 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
            <Image src="/images/logo-2.jpeg" alt="Logo" fill unoptimized={true}  className="object-cover rounded-full" />
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none">
            Access the <span className="text-red-500">Archive</span>
          </h1>
          <p className="text-neutral-500 text-[9px] font-bold uppercase tracking-[0.3em] mt-3">
            Member Authentication
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Username Input */}
          <div className="relative group">
            <HiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-red-500 transition-colors" size={20} />
            <input
              type="text"
              placeholder="MAESTRO USERNAME"
              className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-red-500/50 transition-all"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              required
            />
          </div>

          {/* Password Input */}
          <div className="relative group">
            <HiLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-red-500 transition-colors" size={20} />
            <input
              type="password"
              placeholder="PASSWORD"
              className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-red-500/50 transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Error Message Display */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
              <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">{error}</p>
            </div>
          )}

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-5 bg-white text-black hover:bg-red-600 hover:text-white rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg"
          >
            {loading ? 'Verifying...' : 'Initialize Session'}
            <HiArrowRight size={18} />
          </button>
        </form>

        <div className="mt-10 pt-6 border-t border-white/5 text-center">
            <p className="text-neutral-600 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
              New to the Drive? <Link href="/signup" className="text-white hover:text-red-500 transition-colors">Apply Here</Link>
            </p>
        </div>
      </motion.div>
    </div>
  );
}