import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Turbopack root hint — cast in a typed-safe way for linter compatibility
  experimental: ({ turbopack: { root: './' } } as unknown as NextConfig['experimental']),
};

export default nextConfig;
