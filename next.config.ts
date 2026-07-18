import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Phone testing against the dev server (LAN IP or a cloudflared quick
  // tunnel): Next 16 blocks dev assets/HMR for origins it does not know,
  // which loads the HTML shell and nothing else. Dev-only setting — ignored
  // by production builds.
  allowedDevOrigins: ["192.168.1.40", "*.trycloudflare.com"],
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
