import type { NextConfig } from "next";
import { ATLAS_FILES } from "./src/features/atlas/files";

/** A door's data starts with its HTML. An HTTP header, not a preload in the page:
 *  every page's nav prefetches the doors, and a preload rendered into a prefetched
 *  page is fetched as well, while browsers act on a Link header only when they load
 *  the page itself. */
const preloadData = (url: string) => [
  { key: "Link", value: `<${url}>; rel=preload; as=fetch; crossorigin` },
];

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
  async headers() {
    return [
      { source: "/", headers: preloadData(ATLAS_FILES.galaxy) },
      { source: "/stories", headers: preloadData(ATLAS_FILES.myths) },
      { source: "/areas", headers: preloadData(ATLAS_FILES.lands) },
      { source: "/art", headers: preloadData(ATLAS_FILES.loom) },
      { source: "/art/:id((?!list$)[^/]+)", headers: preloadData(ATLAS_FILES.loom) },
    ];
  },
  turbopack: {
    resolveAlias: {
      // R3F expects WebGL exports; Next 16 may resolve `three` to three.webgpu.js.
      three: "three/build/three.module.js",
    },
  },
};

export default nextConfig;
