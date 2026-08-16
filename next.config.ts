import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/rsvp', destination: '/apply', permanent: true },
      { source: '/shadow-tour', destination: '/shadow', permanent: true },
      { source: '/shadow-day/start', destination: '/shadow', permanent: true },
      { source: '/summer-2026', destination: '/school-year-2026-2027', permanent: true },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vonuwpzepwrbdlectspd.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'vonuwpzepwrbdlectspd.supabase.co',
        pathname: '/storage/v1/object/sign/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
};

export default nextConfig;
