'use client';

import { useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { HiUser, HiMail, HiLockClosed, HiArrowRight } from 'react-icons/hi';

export default function SignUpPage() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // --- ADDED VALIDATION CASE ---
    if (username.includes(' ')) {
      setError("Spaces are not allowed in username.");
      setLoading(false);
      return;
    }

    try {
      // 1. Create the user in Supabase
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username.trim(),
          },
        },
      });

      if (authError) throw authError;

      // --- SUCCESS BLOCK: HARD REDIRECT ---
      if (data.user) {
        setLoading(false);
        window.location.href = '/'; 
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred during signup.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/10 blur-[120px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md bg-neutral-900/50 backdrop-blur-xl border border-white/10 p-8 md:p-12 rounded-[2.5rem] shadow-2xl"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-16 h-16 rounded-full border-2 border-red-600 p-1 mb-4 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
            <Image src="/images/logo-2.jpeg" alt="Logo" fill unoptimized={true} className="object-cover rounded-full" />
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none">
            Join the <span className="text-red-500">Drive</span>
          </h1>
          <p className="text-neutral-500 text-[9px] font-bold uppercase tracking-[0.3em] mt-3">
            Instant Access Archive
          </p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
          {/* Username */}
          <div className="relative group">
            <HiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-red-500 transition-colors" size={20} />
            <input
              type="text"
              placeholder="MAESTRO USERNAME"
              className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-red-500/50 transition-all font-bold"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          {/* Email */}
          <div className="relative group">
            <HiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-red-500 transition-colors" size={20} />
            <input
              type="email"
              placeholder="EMAIL ADDRESS"
              className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-red-500/50 transition-all font-bold"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div className="relative group">
            <HiLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-red-500 transition-colors" size={20} />
            <input
              type="password"
              placeholder="PASSWORD"
              className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-red-500/50 transition-all font-bold"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Error Message Case */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
              <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-5 bg-white text-black hover:bg-red-600 hover:text-white rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg"
          >
            {loading ? 'Initializing...' : 'Engage Drive'}
            <HiArrowRight size={18} />
          </button>
        </form>

        <p className="text-center mt-8 text-neutral-600 text-[10px] font-bold uppercase tracking-widest">
          Already a member? <Link href="/login" className="text-white hover:text-red-500 transition-colors">Login Here</Link>
        </p>
      </motion.div>
    </div>
  );
}