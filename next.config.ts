import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Uygulama tamamen yerel ve dinamik: sayfa her açılışta güncel tarihi ve veri dosyasını okur.
  devIndicators: false,
  // Backend (FastAPI): yerelde 8210 portundaki uvicorn, Vercel'de api/index.py Python fonksiyonu.
  rewrites: async () => [
    {
      source: "/api/py/:path*",
      destination: process.env.VERCEL ? "/api/" : "http://127.0.0.1:8210/api/py/:path*",
    },
  ],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
