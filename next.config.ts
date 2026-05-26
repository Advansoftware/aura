import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'steamverde.net',
      },
      {
        protocol: 'https',
        hostname: 'i0.wp.com',
      },
    ],
  },
};

export default nextConfig;
