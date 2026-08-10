import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // This repo keeps its own docs; no need for generated agent rule files.
  agentRules: false,
};

export default nextConfig;
