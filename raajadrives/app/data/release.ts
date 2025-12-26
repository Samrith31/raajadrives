export type ReleaseType =
  | 'hires-flac'
  | 'cd-flac'
  | 'cdrip'
  | 'lprip'
  | 'single';

export interface Release {
  id: string;
  title: string;
  artist: string;
  slug: string;
  year?: number;
  type: ReleaseType;
  cover: string;
  downloadUrl: string;
  quality?: string;
  
  // 👇 1. Added to distinguish between Album and Single layouts
  isSingle: boolean; 

  // 👇 2. Added to store the Community Fidelity data
  ratingSum?: number; 
  ratingCount?: number;
  
  // 👇 3. Optional: Added for technical track metadata
  duration?: string; 
}