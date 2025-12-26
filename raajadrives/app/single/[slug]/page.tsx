import { supabase } from '@/app/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import CommentSection from '@/app/components/CommentSection';
import BackgroundSlideshow from '@/app/components/BackgroundSlideshow';
import StarRating from '@/app/components/StarRating';

export const revalidate = 0;

interface SinglePageProps {
  params: Promise<{ slug: string }>;
}

// Strictly Typed Interface to prevent ESLint "any" errors
interface DatabaseRow {
  id: string;
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

async function getSingle(slug: string): Promise<DatabaseRow | null> {
  const { data, error } = await supabase
    .from('releases')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) return null;
  return data as DatabaseRow;
}

export default async function SinglePage({ params }: SinglePageProps) {
  const { slug } = await params;
  const single = await getSingle(slug);

  if (!single) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col items-center pt-32 pb-20 px-6 relative isolate">
      {/* Dynamic Background */}
      <BackgroundSlideshow />

      {/* --- Single Track Layout --- */}
      <div className="max-w-2xl w-full z-10 flex flex-col items-center text-center">
        
        {/* Compact Artwork with Floating Badge */}
        <div className="relative aspect-square w-full max-w-[340px] mb-10 group">
          <div className="absolute inset-0 bg-red-600/20 blur-3xl rounded-full scale-75 group-hover:scale-100 transition-transform duration-1000 opacity-50" />
          <div className="relative h-full w-full rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden border border-white/10">
            <Image
              src={single.cover_url || '/images/placeholder.jpg'}
              alt={single.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-1000"
              priority 
            />
            {/* The Amber "Single" Tag */}
            <div className="absolute top-4 left-4 px-3 py-1 bg-amber-500 text-black text-[10px] font-black uppercase rounded-sm tracking-[0.2em] shadow-xl">
              Single
            </div>
          </div>
        </div>

        {/* Title & Artist with Display Typography */}
        <div className="mb-8">
          <h1 className="font-display text-5xl md:text-6xl font-black text-white mb-3 tracking-tighter drop-shadow-2xl">
            {single.title}
          </h1>
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-red-600" />
            <p className="text-xl text-neutral-400 font-medium tracking-widest uppercase">
              {single.artist}
            </p>
            <span className="h-px w-8 bg-red-600" />
          </div>
        </div>

        {/* Fidelity Rating Module */}
        <div className="mb-10 p-6 bg-black/40 border border-white/5 rounded-3xl backdrop-blur-md shadow-2xl">
           <StarRating 
             albumId={single.id} 
             initialSum={Number(single.rating_sum) || 0} 
             initialCount={Number(single.rating_count) || 0} 
           />
        </div>

        {/* Technical Specs Grid */}
        <div className="grid grid-cols-2 gap-4 w-full mb-12 font-mono">
          <div className="bg-white/[0.03] border border-white/5 p-5 rounded-2xl text-left hover:border-red-500/30 transition-colors group">
            <span className="block text-[10px] text-neutral-500 uppercase tracking-widest mb-2 group-hover:text-red-500 transition-colors">Digital Source</span>
            <span className="text-sm text-white font-bold uppercase">
                {single.type.replace('-', ' ')}
            </span>
          </div>
          <div className="bg-white/[0.03] border border-white/5 p-5 rounded-2xl text-left hover:border-amber-500/30 transition-colors group">
            <span className="block text-[10px] text-neutral-500 uppercase tracking-widest mb-2 group-hover:text-amber-500 transition-colors">Quality</span>
            <span className="text-sm text-white font-bold uppercase">
                {single.quality || 'Lossless FLAC'}
            </span>
          </div>
        </div>

        {/* Action Button: Inverted Style */}
        <div className="w-full flex flex-col items-center gap-6">
          <Link
            href={single.download_url}
            target="_blank"
            className="group relative flex items-center justify-center w-full py-6 bg-white text-black font-black uppercase tracking-[0.3em] rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.1)] overflow-hidden"
          >
            <span className="relative z-10">Download Lossless</span>
            <div className="absolute inset-0 bg-red-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          </Link>
          
          <div className="flex items-center gap-4 text-[10px] text-neutral-500 font-bold uppercase tracking-[0.2em]">
            <span>{single.year} Release</span>
            <span className="w-1 h-1 bg-neutral-700 rounded-full" />
            <span>Studio Master</span>
            <span className="w-1 h-1 bg-neutral-700 rounded-full" />
            <span>FLAC 16/44.1</span>
          </div>
        </div>
      </div>

      {/* --- Community Section --- */}
      <div className="w-full max-w-2xl mt-24 z-10">
        <div className="flex items-center gap-4 mb-10">
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white whitespace-nowrap">Listener Feedback</h2>
            <div className="h-px w-full bg-gradient-to-r from-white/20 to-transparent" />
        </div>
        <CommentSection slug={single.slug} />
      </div>

    </div>
  );
}