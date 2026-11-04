import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The atlas is plain files on Cloudflare (docs/HOSTING.md): `next build` writes
  // the static export to out/, and `pnpm cf:build` finishes it for the host, its
  // response headers included (scripts/finish-export.ts).
  output: "export",
  // Phone testing against the dev server (LAN IP or a cloudflared quick
  // tunnel): Next 16 blocks dev assets/HMR for origins it does not know,
  // which loads the HTML shell and nothing else. Dev-only setting — ignored
  // by production builds.
  allowedDevOrigins: ["192.168.1.40", "*.trycloudflare.com"],
  images: {
    // A static export has no image optimizer. Every image already loads as it
    // is: the art straight from Wikimedia Commons thumbnails.
    unoptimized: true,
  },
  turbopack: {
    resolveAlias: {
      // R3F expects WebGL exports; Next 16 may resolve `three` to three.webgpu.js.
      three: "three/build/three.module.js",
    },
  },
};

export default nextConfig;
