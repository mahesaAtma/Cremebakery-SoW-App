import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // allow screenshot uploads up to 4 MB (Vercel caps request bodies at 4.5 MB)
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
