import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "miasmatic-foggy-jakob.ngrok-free.dev",
        "clubpiggy.com",
        "piggyverse.pxxl.click"
      ],
    },
  },
};

export default nextConfig;
