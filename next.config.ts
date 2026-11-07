import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep native/server-only packages out of the bundler.
  serverExternalPackages: ["mongoose", "mongodb-memory-server", "bcryptjs"],
};

export default nextConfig;
