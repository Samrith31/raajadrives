import { supabase } from '@/app/lib/supabase';
import { ArrowRight, ChevronLeft, Megaphone } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export const revalidate = 0;

interface Announcement {
  id: string;
  text: string;
  link: string;
  image_url?: string | null;
  created_at: string;
}

export default async function AnnouncementsPage() {
  const { data: logs, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching signals:', error);
  }

  return (
    <main className="min-h-screen bg-[#0A0A0B] text-white selection:bg-red-600/30">
      {/* --- BACKGROUND ACCENTS --- */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-red-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-neutral-900/20 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-12 md:pt-32 pb-24 relative z-10">
        {/* --- NAVIGATION --- */}
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 hover:text-red-500 mb-16 transition-all"
        >
          <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Back to Drive
        </Link>

        {/* --- HEADER --- */}
        <header className="mb-20">
          <div className="flex items-center gap-3 mb-4">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="text-xs font-bold tracking-[0.2em] text-red-500 uppercase">
              Archive Announcements
            </span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tighter mb-6 leading-none">
            Raaja&apos;s <span className="text-neutral-500 italic">Updates</span>
          </h1>

          <p className="text-neutral-400 text-lg max-w-xl font-light leading-relaxed">
            The latest signals, release news, and archival discoveries.
          </p>
        </header>

        {/* --- ANNOUNCEMENTS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {logs && logs.length > 0 ? (
            logs.map((log: Announcement) => (
              <article
                key={log.id}
                className="group relative flex flex-col bg-white/[0.02] border border-white/5 rounded-[2rem] overflow-hidden hover:bg-white/[0.04] hover:border-red-500/30 transition-all duration-500 shadow-2xl"
              >
                {/* Cinematic Media Section */}
                {log.image_url && (
                  <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-white/5">
                    <Image
                      src={log.image_url}
                      alt=""
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-1000 opacity-80 group-hover:opacity-100"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 to-transparent" />
                  </div>
                )}

                <div className="p-8 flex flex-col flex-1">
                  <time className="text-[10px] font-bold text-red-500 uppercase tracking-[0.2em] mb-4">
                    {new Date(log.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </time>

                  <h2 className="text-xl md:text-2xl font-bold text-white leading-tight mb-8">
                    {log.text}
                  </h2>

                  <div className="mt-auto">
                    <Link
                      href={log.link || '#'}
                      className="inline-flex items-center gap-3 text-xs font-black uppercase tracking-widest text-white group-hover:text-red-500 transition-colors"
                    >
                      Learn More
                      <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                    </Link>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="col-span-full py-32 text-center border border-dashed border-white/10 rounded-[2rem] bg-neutral-900/20">
              <Megaphone className="mx-auto text-neutral-800 mb-6" size={48} />
              <p className="text-neutral-500 font-bold uppercase tracking-[0.3em] text-xs">
                No active announcements
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}