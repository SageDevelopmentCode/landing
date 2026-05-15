import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/rsvp', destination: '/apply', permanent: true },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '11mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vonuwpzepwrbdlectspd.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
