'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';

// 1. Define the interface for the database row
interface Album {
  id: string;
  title: string;
  artist: string;
  year: number;
  type: string;
  cover_url: string | null; // Matches Supabase column name
}

export default function EditIndexPage() {
  // 2. Use the interface in useState instead of 'any[]'
  const [releases, setReleases] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReleases = async () => {
      const { data, error } = await supabase
        .from('releases')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching albums:', error);
      } else {
        // 3. Cast the data safely
        setReleases((data as Album[]) || []);
      }
      setLoading(false);
    };

    fetchReleases();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="animate-pulse text-neutral-500 font-mono">Loading Archive...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex items-center justify-between mb-8 border-b border-neutral-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Edit Albums</h1>
            <p className="text-neutral-500 text-sm mt-1">Select an album to update details or cover art.</p>
          </div>
          <Link 
            href="/admin" 
            className="text-sm font-bold text-neutral-400 hover:text-white transition"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <div className="space-y-3">
          {releases.map((album) => (
            <div 
              key={album.id} 
              className="group flex items-center gap-4 p-3 bg-neutral-900/50 hover:bg-neutral-900 border border-neutral-800 rounded-lg transition-all"
            >
              {/* Thumbnail */}
              <div className="relative w-16 h-16 shrink-0 rounded bg-neutral-800 overflow-hidden border border-neutral-700/50">
                <Image 
                  src={album.cover_url || '/placeholder.jpg'} 
                  alt={album.title} 
                  fill 
                  className="object-cover group-hover:scale-110 transition-transform duration-500" 
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white truncate group-hover:text-red-500 transition-colors">
                  {album.title}
                </h3>
                <p className="text-xs text-neutral-500 truncate">
                  {album.artist} • {album.year}
                </p>
              </div>

              {/* Format Badge */}
              <div className="hidden sm:block">
                <span className="text-[10px] uppercase font-bold text-neutral-500 bg-black/50 px-2 py-1 rounded border border-neutral-800">
                  {album.type}
                </span>
              </div>

              {/* Edit Action */}
              <Link 
                href={`/admin/edit/${album.id}`}
                className="px-6 py-2 bg-white text-black text-sm font-bold rounded-full hover:bg-neutral-200 transition shrink-0"
              >
                Edit
              </Link>
            </div>
          ))}

          {releases.length === 0 && (
            <div className="text-center py-20 text-neutral-600">
              No albums found. <Link href="/admin/upload" className="text-white underline">Upload one first.</Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}