import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "pub-1e036f7824024166a65ba60f99d3226f.r2.dev" },
      { protocol: "https", hostname: "*.r2.dev" },
      { protocol: "https", hostname: "randomuser.me" },
    ],
  },
};

export default nextConfig;
