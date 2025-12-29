import { supabase } from '@/app/lib/supabase';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import CommentSection from '@/app/components/CommentSection';
import BackgroundSlideshow from '@/app/components/BackgroundSlideshow';
import StarRating from '@/app/components/StarRating';
import DownloadButton from '@/app/components/DownloadButton';
import LikeButton from '@/app/components/LikeButton';
import { IconType } from 'react-icons';
import { HiOutlineDatabase, HiOutlineMusicNote, HiCalendar } from 'react-icons/hi';

export const revalidate = 0;

// --- STRICT TYPES ---
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

interface SinglePageProps {
  params: Promise<{ slug: string }>;
}

interface SpecCardProps {
  icon: IconType;
  label: string;
  value: string | number;
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

// --- HELPER COMPONENT ---
function SpecCard({ icon: Icon, label, value }: SpecCardProps) {
  return (
    <div className="bg-white/[0.03] border border-white/5 p-5 rounded-2xl text-left hover:border-red-500/30 transition-colors group">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="text-neutral-500 group-hover:text-red-500 transition-colors" size={14} />
        <span className="block text-[10px] text-neutral-500 uppercase tracking-widest group-hover:text-red-500 transition-colors">
          {label}
        </span>
      </div>
      <span className="text-sm text-white font-bold uppercase tracking-tight">
        {value}
      </span>
    </div>
  );
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

      <div className="max-w-2xl w-full z-10 flex flex-col items-center text-center">
        
        {/* 1. Artwork with Glow */}
        <div className="relative aspect-square w-full max-w-[340px] mb-8 group">
          <div className="absolute inset-0 bg-red-600/20 blur-3xl rounded-full scale-75 group-hover:scale-100 transition-transform duration-1000 opacity-50" />
          <div className="relative h-full w-full rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden border border-white/10">
            <Image
              src={single.cover_url || '/images/placeholder.jpg'}
              alt={single.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-[2s]"
              sizes="340px"
              priority 
            />
            {/* The Badge */}
            <div className="absolute top-4 left-4 px-3 py-1 bg-amber-500 text-black text-[10px] font-black uppercase rounded-sm tracking-[0.2em] shadow-xl">
              {single.type === 'single' ? 'Single' : 'EP'}
            </div>
          </div>
        </div>

        {/* 2. Action Row (Likes) */}
        <div className="mb-8">
          <LikeButton releaseId={single.id} />
        </div>

        {/* 3. Title & Artist */}
        <div className="mb-10">
          <h1 className="font-display text-5xl md:text-6xl font-black text-white mb-3 tracking-tighter drop-shadow-2xl uppercase">
            {single.title}
          </h1>
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-red-600 shadow-[0_0_10px_#dc2626]" />
            <p className="text-xl text-neutral-400 font-medium tracking-widest uppercase italic">
              {single.artist}
            </p>
            <span className="h-px w-8 bg-red-600 shadow-[0_0_10px_#dc2626]" />
          </div>
        </div>

        {/* 4. Rating Module */}
        <div className="mb-10 w-full p-6 bg-black/40 border border-white/5 rounded-3xl backdrop-blur-md shadow-2xl flex flex-col items-center justify-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 mb-4 text-center">
            How much you like ..?
          </p>
          <StarRating albumId={single.id} />
        </div>

{/* 5. Technical Spec - Year Only */}
<div className="flex justify-center w-full mb-12 font-mono">
  <div className="w-full max-w-[180px]">
    <SpecCard 
      icon={HiCalendar} 
      label="Year" 
      value={single.year || 'N/A'} 
    />
  </div>
</div>

        {/* 6. Action Button */}
        <div className="w-full flex flex-col items-center gap-6">
          <DownloadButton downloadUrl={single.download_url} />
          <p className="text-[9px] text-neutral-500 uppercase tracking-[0.3em] font-bold">
            Archivist Vault Access
          </p>
        </div>
      </div>

      {/* 7. Community Section */}
      <div className="w-full max-w-2xl mt-24 z-10">
        <div className="flex items-center gap-4 mb-10">
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white whitespace-nowrap italic">
              Listener <span className="text-neutral-600">Feedback</span>
            </h2>
            <div className="h-px w-full bg-gradient-to-r from-white/20 to-transparent" />
        </div>
        <CommentSection slug={single.slug} />
      </div>
    </div>
  );
}