import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // NOTE: removed an unsupported `experimental.turbopack` key that caused Next.js to
  // report "Unrecognized key(s) in object: 'turbopack'". If you still want to
  // silence the workspace root warning, either remove the additional lockfile(s)
  // from the repo root or set the turbopack root in a Next.js-supported way for
  // your installed Next.js version. For now we keep this file minimal to avoid
  // runtime/validation errors.
};

export default nextConfig;
