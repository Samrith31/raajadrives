import { supabase } from '@/app/lib/supabase';
import { Release, ReleaseType } from '@/app/data/release';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import CommentSection from '@/app/components/CommentSection';
import BackgroundSlideshow from '@/app/components/BackgroundSlideshow';
import StarRating from '@/app/components/StarRating';

export const revalidate = 0;

interface AlbumPageProps {
  params: Promise<{ slug: string }>;
}

// 1. Defining the exact shape of the data from Supabase
interface DatabaseRow {
  id: string;
  created_at: string;
  title: string;
  artist: string;
  slug: string;
  year: number;
  type: string;
  quality: string | null;
  cover_url: string | null;
  download_url: string;
  rating_sum: number | null;
  rating_count: number | null;
}

// 2. Specify DatabaseRow | null instead of any | null
async function getAlbum(slug: string): Promise<DatabaseRow | null> {
  const { data, error } = await supabase
    .from('releases')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) return null;

  return data as DatabaseRow;
}

export default async function AlbumPage({ params }: AlbumPageProps) {
  const { slug } = await params;
  const album = await getAlbum(slug);

  if (!album) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-20 px-6 relative isolate">
      <BackgroundSlideshow />

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-10 items-center mb-16 z-10">
        
        {/* Left Col: Cover Art */}
        <div className="relative aspect-square w-full max-w-[400px] mx-auto rounded-xl shadow-2xl shadow-black/70 overflow-hidden border border-white/10 group">
          <Image
            src={album.cover_url || '/images/placeholder.jpg'}
            alt={album.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 400px"
            priority 
          />
        </div>

        {/* Right Col: Details */}
        <div className="space-y-6 text-center md:text-left">
          <div>
            {album.quality && (
              <span className="inline-block mb-3 px-3 py-1 text-xs font-bold tracking-widest text-red-400 bg-red-900/20 border border-red-500/20 rounded-full uppercase">
                {album.quality}
              </span>
            )}
            <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight mb-2 text-white drop-shadow-lg">
              {album.title}
            </h1>
            <p className="font-ui text-xl text-neutral-300 drop-shadow-md">
              {album.artist}
            </p>
          </div>

          {/* Star Rating Section */}
          <div className="py-2 flex justify-center md:justify-start border-y border-white/5 md:border-none">
             <StarRating 
               albumId={album.id} 
               initialSum={Number(album.rating_sum) || 0} 
               initialCount={Number(album.rating_count) || 0} 
             />
          </div>

          <div className="flex flex-col gap-1 text-sm text-neutral-400 font-mono border-l-2 border-neutral-700 pl-4 mx-auto md:mx-0 max-w-max bg-black/30 p-2 rounded-r-lg backdrop-blur-sm">
            <span>Year: {album.year || 'N/A'}</span>
            <span>
              Format: {
                album.type === 'lprip' ? 'Vinyl Rip' : 
                album.type === 'cdrip' ? 'CD Rip' : 'Digital DL Flac'
              }
            </span>
          </div>

          <div className="pt-4">
            <Link
              href={album.download_url}
              target="_blank"
              className="inline-flex items-center justify-center w-full md:w-auto px-8 py-4 font-bold text-white bg-red-600 rounded-full hover:bg-red-500 hover:scale-105 transition-all shadow-lg shadow-red-900/30 active:scale-95"
            >
              Download Album
            </Link>
            <p className="mt-3 text-xs text-neutral-400">
              Direct download • No compression
            </p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-2xl z-10">
        <CommentSection slug={album.slug} />
      </div>
    </div>
  );
}