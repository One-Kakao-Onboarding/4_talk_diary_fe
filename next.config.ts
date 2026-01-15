import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isProd ? "/4_talk_diary_fe" : "",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
