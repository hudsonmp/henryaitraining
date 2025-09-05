import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  },
  // For deployment and build optimization
  experimental: {
    serverComponentsExternalPackages: ['openai'],
  },
};

export default nextConfig;
