import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  generateBuildId: async () => `build-${Date.now()}`,
  devIndicators: false,
};

export default nextConfig;
