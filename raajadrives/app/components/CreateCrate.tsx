'use client';

import Image from 'next/image';
import { useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import { useAuth } from '@/app/context/AuthContext';
import { HiX } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';

export default function CreateCrate({ isOpen, onClose, onRefresh }: { 
  isOpen: boolean; 
  onClose: () => void;
  onRefresh: () => void;
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!user || !formData.title.trim()) return;
  setLoading(true);

  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const crateLabel = `CRT-${randomSuffix}`;

  try {
    const { error } = await supabase
      .from('crates')
      .insert([{
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        crate_id_label: crateLabel
      }]);

    if (error) throw error;

    // 1. Trigger the server-side refresh first
    await onRefresh(); 
    
    // 2. Clear the form state
    setFormData({ title: '', description: '' });
    
    // 3. Close the modal after the signal is sent
    onClose(); 

  } catch (err) {
    console.error("Archive Error:", err);
    // Use a reddish alert or toast if possible
    alert('System Error: Failed to establish archive.');
  } finally {
    setLoading(false);
  }
};

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/95" 
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 30 }}
            className="relative w-full max-w-sm sm:max-w-md bg-gradient-to-b from-neutral-900/95 to-black/90 border border-neutral-700/60 rounded-2xl sm:rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-[0_25px_75px_rgba(0,0,0,0.9)] mx-2 max-h-[95vh] overflow-y-auto"
          >
            {/* CRATE LOGO */}
            <div className="mb-8 text-center pt-2">
              <div className="relative mx-auto mb-6">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-black/95 to-neutral-900/80 border-4 border-neutral-700 shadow-[0_0_30px_rgba(0,0,0,0.8)] relative overflow-hidden mx-auto">
                  {/* Center Logo */}
                  <div className="absolute inset-0 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500/90 to-red-600/90 border-3 border-white/40 shadow-[0_0_25px_rgba(255,165,0,0.6)]">
                    <Image 
                      src="/images/crate-logo.jpeg"
                      alt="Crate Logo"
                      width={96}
                      height={96}
                      unoptimized={true}
                      className="w-4/5 h-4/5 object-contain rounded-full"
                      priority
                    />
                  </div>
                  {/* Vinyl Spin Ring */}
                  <div className="absolute inset-0 rounded-full opacity-20 bg-[conic-gradient(from_0deg,#444_0deg,transparent_90deg)] animate-[spin_20s_linear_infinite]" />
                </div>
              </div>

              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mb-2 drop-shadow-2xl italic bg-gradient-to-r from-white via-orange-400 to-red-500 bg-clip-text text-transparent">
                Build in Crate
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400 uppercase tracking-wider font-mono">
                Build your Playlist
              </p>
            </div>

            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-neutral-500 hover:text-orange-400 p-2 rounded-full border border-neutral-700 hover:border-orange-500 transition-all text-lg sm:text-xl"
            >
              <HiX />
            </button>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Crate Name */}
              <div>
                <label className="block text-xs font-bold text-white mb-2 drop-shadow-2xl italic bg-gradient-to-r from-white via-orange-400 to-red-500 bg-clip-text text-transparent">
                  Crate Name
                </label>
                <input 
                  type="text"
                  required
                  maxLength={30}
                  placeholder="e.g., 80s Disco Gems"
                  className="w-full p-3 bg-neutral-950 border border-white/20 rounded-xl focus:border-orange-500 text-white font-bold placeholder:text-neutral-600 transition-all min-h-[44px]"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-white mb-2 drop-shadow-2xl italic bg-gradient-to-r from-white via-orange-400 to-red-500 bg-clip-text text-transparent">
                  Notes
                </label>
                <textarea 
                  rows={2}
                  maxLength={80}
                  placeholder="What's this playlist mean to you."
                  className="w-full p-3 bg-neutral-950 border border-white/20 rounded-xl focus:border-orange-500 text-white text-sm placeholder:text-neutral-600 transition-all resize-vertical min-h-[60px] max-h-[100px]"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading || !formData.title.trim()}
                className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-black uppercase tracking-wide text-sm rounded-xl shadow-lg disabled:opacity-50 min-h-[44px]"
                whileHover={{ scale: 1.03, boxShadow: '0 8px 20px rgba(255,165,0,0.4)' }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {loading ? 'Stacking...' : 'Build Crate'}
              </motion.button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
