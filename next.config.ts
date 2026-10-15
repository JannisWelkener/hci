import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // ⚠ This allows production builds to succeed even if there are ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to complete
    // even if your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  // Enable standalone output for optimized Docker builds
  // This creates a minimal production build without needing full node_modules
  output: "standalone",
};

export default nextConfig;
