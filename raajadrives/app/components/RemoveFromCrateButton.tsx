'use client';

import { useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import { HiX } from 'react-icons/hi';
import { useRouter } from 'next/navigation';

export default function RemoveFromCrateButton({ crateId, releaseId }: { crateId: string, releaseId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRemove = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('crate_items')
      .delete()
      .eq('crate_id', crateId)
      .eq('release_id', releaseId);

    if (!error) router.refresh();
    setLoading(false);
  };

  return (
    <button 
      onClick={handleRemove}
      disabled={loading}
      className="p-2 bg-black/80 border border-white/10 text-red-500 rounded-full hover:bg-red-600 hover:text-white transition-all shadow-xl backdrop-blur-md"
    >
      <HiX size={14} />
    </button>
  );
}