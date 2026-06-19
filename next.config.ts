import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Legacy galleries (characters and sagas) embed public-domain art straight from
    // Wikimedia Commons; next/image rejects any remote host not listed here.
    remotePatterns: [{ protocol: "https", hostname: "upload.wikimedia.org" }],
  },
  turbopack: {
    resolveAlias: {
      // R3F expects WebGL exports; Next 16 may resolve `three` to three.webgpu.js.
      three: "three/build/three.module.js",
    },
  },
};

export default nextConfig;
