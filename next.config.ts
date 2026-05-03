// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Casting to 'any' bypasses the 'known properties' error 
    // while still forcing Turbopack to stay inside your project root.
    turbopack: {
      root: '.',
    },
  } as any, 
};

export default nextConfig;