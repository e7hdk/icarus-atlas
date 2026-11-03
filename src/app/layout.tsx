import type { Metadata } from "next";
import { Cinzel, Cormorant_Garamond } from "next/font/google";
import { preload } from "react-dom";
import "./globals.css";
import { AmbientAudio } from "@/components/audio/AmbientAudio";
import { AtlasBar } from "@/components/hud/AtlasBar";
import { EphemerisHost } from "@/components/hud/EphemerisHost";
import { GlobalOverlays } from "@/components/hud/GlobalOverlays";
import { ATLAS_FILES } from "@/features/atlas/files";
import { loadAtlasData } from "@/features/characters/load";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3500"),
  ),
  title: "Icarus Atlas",
  description:
    "An interactive galaxy of Greek mythology — every figure a star, every story with more than one teller.",
  openGraph: {
    siteName: "Icarus Atlas",
    type: "website",
    title: "Icarus Atlas",
    description:
      "An interactive galaxy of Greek mythology — every figure a star, every story with more than one teller.",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The one chrome of the atlas. Whatever goes through props here is repeated in
  // every prerendered page, so the ⌘K index and the Ephemeris data are baked files
  // instead (public/atlas). The Ephemeris is preloaded because the day's chip reads
  // it on every page; the index waits until it is wanted.
  const { characters, sources } = await loadAtlasData();
  preload(ATLAS_FILES.ephemeris, { as: "fetch", crossOrigin: "anonymous" });

  return (
    <html
      lang="en"
      // Gilded is the atlas's chrome, not an option — served from the root so
      // the gold never flashes in (fourth theme review).
      data-theme="gilded"
      className={`${cinzel.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AtlasBar />
        {children}
        <GlobalOverlays sources={sources} starCount={characters.length} />
        <EphemerisHost />
        <AmbientAudio />
      </body>
    </html>
  );
}
