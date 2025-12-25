// data/releases.ts

export type ReleaseType =
  | 'hires-flac'
  | 'cd-flac'
  | 'cdrip'
  | 'lprip';

export interface Release {
  id: string;          // <--- Added this required field
  title: string;
  artist: string;
  slug: string;
  year?: number;
  type: ReleaseType;
  cover: string;       
  downloadUrl: string; 
  quality?: string;    
}

export const releases: Release[] = [
  {
    id: '1',           // <--- Added ID
    title: 'Thalapathi',
    artist: 'Ilaiyaraaja',
    year: 1991,
    slug: 'thalapathi-1991',
    type: 'hires-flac',
    quality: '24bit / 96kHz',
    cover: '/covers/thalapathi.jpg',
    downloadUrl: 'https://your-download-link'
  },
  {
    id: '2',           // <--- Added ID
    title: 'Mouna Ragam',
    artist: 'Ilaiyaraaja',
    year: 1986,
    slug: 'mouna-ragam-1986',
    type: 'cd-flac',
    quality: '16bit / 44.1kHz',
    cover: '/covers/mouna-ragam.jpg',
    downloadUrl: 'https://your-download-link'
  },
  {
    id: '3',           // <--- Added ID
    title: 'Alaigal Oivathillai',
    artist: 'Ilaiyaraaja',
    slug: 'alaigal-oivathillai-cd',
    type: 'cdrip',
    cover: '/covers/alaigal-cd.jpg',
    downloadUrl: 'https://your-download-link'
  },
  {
    id: '4',           // <--- Added ID
    title: 'Nayakan',
    artist: 'Ilaiyaraaja',
    slug: 'nayakan-lp',
    type: 'lprip',
    cover: '/covers/nayakan-lp.jpg',
    downloadUrl: 'https://your-download-link'
  }
];