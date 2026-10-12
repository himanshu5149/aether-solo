import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // node:sqlite is a Node builtin; keep it external to the bundler.
  serverExternalPackages: [],
};

export default nextConfig;
