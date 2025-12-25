import { supabase } from '@/app/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';

export const revalidate = 0;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q: string }>;
}) {
  const { q } = await searchParams;
  const query = q || '';

  // Search Supabase (Check Title OR Artist)
  const { data } = await supabase
    .from('releases')
    .select('*')
    .or(`title.ilike.%${query}%,artist.ilike.%${query}%`) // Case-insensitive search
    .order('created_at', { ascending: false });

  const albums = data || [];

  return (
    <div className="min-h-[60vh] text-white">
      <h2 className="text-2xl font-bold mb-8 text-neutral-400">
        Search results for &quot;<span className="text-white">{query}</span>&quot;
      </h2>

      <div className="grid grid-cols-1 gap-4">
        {albums.length === 0 ? (
          <p className="text-neutral-500">No matching albums found.</p>
        ) : (
          albums.map((album) => {
             // Determine Link
             let prefix = '/flac';
             if (album.type === 'lprip') prefix = '/lprips';
             if (album.type === 'cdrip') prefix = '/cdrips';

             return (
              <Link key={album.id} href={`${prefix}/${album.slug}`} className="group block">
                <div className="flex items-center gap-4 p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-neutral-900">
                    <Image src={album.cover_url || '/images/placeholder.jpg'} alt="" fill className="object-cover" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white group-hover:text-red-500 transition-colors">{album.title}</h3>
                    <p className="text-sm text-neutral-400">{album.artist}</p>
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  );
}