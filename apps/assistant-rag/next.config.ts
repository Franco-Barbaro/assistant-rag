import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    outputFileTracingRoot: path.join(__dirname, "../../"),
  }
};

export default nextConfig;
