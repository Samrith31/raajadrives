import Image from 'next/image';
import Link from 'next/link';
import { Release } from '@/app/data/release';

export default function AlbumCard({
  album,
  href,
}: {
  album: Release;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-xl overflow-hidden bg-neutral-900/60 hover:bg-neutral-800/70 transition border border-white/5 hover:border-white/10"
    >
      {/* Image Container with Fallback Background */}
      <div className="relative aspect-square bg-neutral-800">
        <Image
          src={album.cover}
          alt={album.title}
          fill
          // Optimize loading for different screen sizes
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
      </div>

      <div className="p-4">
        {/* Title */}
        <h3 className="font-display font-semibold text-sm truncate text-neutral-200 group-hover:text-white transition-colors">
          {album.title}
        </h3>
        
        {/* Year • Artist Row */}
        <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1">
          {album.year && (
            <>
              <span className="text-neutral-300">{album.year}</span>
              <span className="text-neutral-600">•</span>
            </>
          )}
          <span className="truncate hover:text-neutral-300 transition-colors">
            {album.artist}
          </span>
        </div>

        {/* Quality Badge */}
        {album.quality && (
          <div className="mt-3 flex">
            <span className="inline-flex items-center justify-center text-[10px] font-medium px-2 py-0.5 rounded border border-red-500/20 bg-red-500/10 text-red-400">
              {album.quality}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}