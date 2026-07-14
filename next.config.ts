import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // External packages for server-side
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  
  // Turbopack config (silence webpack warning)
  turbopack: {},
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;

