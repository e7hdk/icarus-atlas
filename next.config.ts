import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      // R3F expects WebGL exports; Next 16 may resolve `three` to three.webgpu.js.
      three: "three/build/three.module.js",
    },
  },
};

export default nextConfig;
