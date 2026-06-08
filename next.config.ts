import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/rsvp', destination: '/apply', permanent: true },
      { source: '/shadow-tour', destination: '/shadow', permanent: true },
      { source: '/shadow-day/start', destination: '/shadow', permanent: true },
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
    ],
  },
};

export default nextConfig;
