import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* 👇 This is the essential part for CapRover/Docker */
  output: 'standalone', 
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'zkmmgecxdkrzyxfwiqnm.supabase.co', 
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;