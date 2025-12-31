import { supabase } from '@/app/lib/supabase';
import { Release, ReleaseType } from '@/app/data/release';
import AlbumGrid from '@/app/components/AlbumGrid';
import SectionHeader from '@/app/components/ui/SectionHeader';
import HeroSlideshow from '@/app/components/HeroSection'; 
import LatestDrops from '@/app/components/LatestDrops';
import HotHits from '@/app/components/HotHits';

export const revalidate = 0;

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
  is_single?: boolean; // Added for routing
}

async function getAlbums(): Promise<Release[]> {
  const { data, error } = await supabase
    .from('releases')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('Error fetching albums:', error);
    return [];
  }

  return (data as DatabaseRow[]).map((item) => ({
    id: item.id,
    title: item.title,
    artist: item.artist,
    slug: item.slug,
    year: item.year,
    type: item.type as ReleaseType, 
    quality: item.quality || undefined,
    cover: item.cover_url || '/images/placeholder.jpg', 
    downloadUrl: item.download_url,
    isSingle: item.is_single || false // Pass this down to AlbumGrid
  }));
}

export default async function HomePage() {
  const releases = await getAlbums();

  return (
    <div className="pb-20">
      
      {/* Hero Section */}
      <HeroSlideshow />

      {/* Latest Drops */}
      <LatestDrops releases={releases} />

      <HotHits />

      <div className="max-w-7xl mx-auto px-6 mt-16 space-y-20">
        
        {/* 1. Digital Downloads */}
        <section>
          <SectionHeader
            title="Digital Downloads"
            subtitle="Hi-Res & 16-bit FLAC/WAV Albums"
            href="/flac"
          />
          <AlbumGrid
            items={releases.filter(
              (r) => (r.type === 'hires-flac' || r.type === 'cd-flac') && !r.isSingle
            )}
            basePath="/flac"
          />
        </section>

        {/* 2. 👇 NEW: Singles & Track Releases */}
        <section>
          <SectionHeader
            title="Singles & EPs"
            subtitle="Individual Track Fidelity Releases"
            href="/single"
          />
          <AlbumGrid
            items={releases.filter((r) => r.type === 'single' || r.isSingle)}
            basePath="/single" // This ensures they link to your new single page
          />
        </section>

        {/* 3. CD Rips */}
        <section>
          <SectionHeader
            title="CD Rips"
            subtitle="Uncompressed WAV Extractions"
            href="/cdrips"
          />
          <AlbumGrid
            items={releases.filter((r) => r.type === 'cdrip' && !r.isSingle)}
            basePath="/cdrips"
          />
        </section>

        {/* 4. LP Rips */}
        <section>
          <SectionHeader
            title="LP Rips"
            subtitle="High-fidelity Vinyl transfers"
            href="/lprips"
          />
          <AlbumGrid
            items={releases.filter((r) => r.type === 'lprip' && !r.isSingle)}
            basePath="/lprips"
          />
        </section>

      </div>
    </div>
  );
}