import type { NextConfig } from "next";

const mediaHosts = new Set([
  "pub-b19d201d05f6467982bec600ac9c4cc1.r2.dev",
  ...(process.env.R2_PUBLIC_URL ? [new URL(process.env.R2_PUBLIC_URL).hostname] : []),
]);

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 85, 90, 95],
    // Avoid the default jump from 1200 straight to 1920 on Retina displays.
    deviceSizes: [640, 750, 828, 1080, 1200, 1536, 1920, 2048, 2560, 3840],
    // Derivative keys are immutable UUIDs (crops/edits mint new keys), so
    // optimized variants can be cached long-term.
    minimumCacheTTL: 2678400,
    remotePatterns: [
      ...Array.from(mediaHosts, (hostname) => ({
        protocol: "https" as const,
        hostname,
        search: "",
      })),
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
      {
        protocol: "https",
        hostname: "i.vimeocdn.com",
      },
    ],
  },
};

export default nextConfig;
