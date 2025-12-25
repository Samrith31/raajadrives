// app/page.tsx
import { supabase } from '@/app/lib/supabase';
import { Release, ReleaseType } from '@/app/data/release';
import AlbumGrid from '@/app/components/AlbumGrid';
import SectionHeader from '@/app/components/ui/SectionHeader';

// ✅ CORRECTED IMPORT: Importing 'HeroSlideshow' from the file 'HeroSection'
import HeroSlideshow from '@/app/components/HeroSection'; 

import LatestDrops from '@/app/components/LatestDrops';

// 0. Disable caching so you always see new uploads immediately
export const revalidate = 0;

// 1. Define the shape of the data COMING from Supabase (snake_case)
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
}

// 2. Fetch and Transform Function
async function getAlbums(): Promise<Release[]> {
  const { data, error } = await supabase
    .from('releases')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('Error fetching albums:', error);
    return [];
  }

  // 3. Map Database columns (snake_case) to App Type (camelCase)
  return (data as DatabaseRow[]).map((item) => ({
    id: item.id,
    title: item.title,
    artist: item.artist,
    slug: item.slug,
    year: item.year,
    type: item.type as ReleaseType, 
    quality: item.quality || undefined,
    cover: item.cover_url || '/images/placeholder.jpg', 
    downloadUrl: item.download_url
  }));
}

export default async function HomePage() {
  const releases = await getAlbums();

  return (
    <div className="pb-20">
      
      {/* Hero Section */}
      <HeroSlideshow />

      {/* Latest Drops (Using Real Data) */}
      <LatestDrops releases={releases} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 mt-16 space-y-20">
        
        {/* Digital Downloads */}
        <section>
          <SectionHeader
            title="Digital Downloads"
            subtitle="Hi-Res & 16-bit FLAC"
            href="/flac"
          />
          <AlbumGrid
            items={releases.filter(
              (r) => r.type === 'hires-flac' || r.type === 'cd-flac'
            )}
            basePath="/flac"
          />
        </section>

        {/* CD Rips */}
        <section>
          <SectionHeader
            title="CD Rips"
            subtitle="Exact Audio Copy (EAC) extractions"
            href="/cdrips"
          />
          <AlbumGrid
            items={releases.filter((r) => r.type === 'cdrip')}
            basePath="/cdrips"
          />
        </section>

        {/* LP Rips */}
        <section>
          <SectionHeader
            title="LP Rips"
            subtitle="High-fidelity Vinyl transfers"
            href="/lprips"
          />
          <AlbumGrid
            items={releases.filter((r) => r.type === 'lprip')}
            basePath="/lprips"
          />
        </section>

      </div>
    </div>
  );
}