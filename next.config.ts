import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Force Turbopack reload for updated Prisma schema
  serverExternalPackages: ['@prisma/client'],
};

export default nextConfig;
