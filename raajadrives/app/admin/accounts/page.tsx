'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import { motion } from 'framer-motion';
import { HiUsers, HiShieldCheck, HiArrowLeft } from 'react-icons/hi';
import Link from 'next/link';

interface Account {
  id: string;
  username: string;
  email: string;
  created_at: string;
}

export default function AdminAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAccounts() {
      // Querying the public profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, email, created_at')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setAccounts(data as Account[]);
      }
      setLoading(false);
    }
    fetchAccounts();
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-neutral-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.3em] mb-4">
              <HiArrowLeft /> Back to Command
            </Link>
            <h1 className="text-3xl md:text-4xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
              <HiShieldCheck className="text-red-600" /> Registry <span className="text-neutral-500 font-medium">Control</span>
            </h1>
          </div>
          <div className="px-4 py-2 bg-red-600/10 border border-red-600/20 rounded-xl">
            <p className="text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <HiUsers size={14}/> {accounts.length} Active Archivists
            </p>
          </div>
        </div>

        {/* Accounts Table */}
        <div className="bg-neutral-900/30 border border-white/5 backdrop-blur-xl rounded-[2rem] overflow-hidden">
          {loading ? (
            <div className="p-20 flex justify-center">
              <div className="w-6 h-6 border-2 border-red-600/20 border-t-red-600 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5">
                    <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Username</th>
                    <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Identifier (Email)</th>
                    <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Registry Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {accounts.map((acc) => (
                    <motion.tr 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      key={acc.id} 
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-6 py-5">
                        <span className="text-white font-bold text-sm tracking-tight italic uppercase">{acc.username}</span>
                      </td>
                      <td className="px-6 py-5 text-neutral-400 text-xs font-mono">{acc.email}</td>
                      <td className="px-6 py-5 text-neutral-500 text-[10px] font-bold uppercase tracking-widest">
                        {new Date(acc.created_at).toLocaleDateString()}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}