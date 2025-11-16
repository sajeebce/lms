import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Allow importing shared editor code from the monorepo root
    externalDir: true,
  },
  reactCompiler: true,
};

export default nextConfig;
