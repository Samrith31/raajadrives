import AlbumCard from './AlbumCard';

import { Release } from '@/app/data/release';

interface Props {
  items: Release[];
  basePath: string;
}

export default function AlbumGrid({ items, basePath }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {items.map(album => (
        <AlbumCard
          key={album.slug}
          album={album}
          href={`${basePath}/${album.slug}`}
        />
      ))}
    </div>
  );
}
