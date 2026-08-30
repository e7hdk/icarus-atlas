import type { Metadata } from "next";
import { Cinzel, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { AmbientAudio } from "@/components/audio/AmbientAudio";
import { AtlasBar } from "@/components/hud/AtlasBar";
import { EphemerisHost } from "@/components/hud/EphemerisHost";
import { GlobalOverlays } from "@/components/hud/GlobalOverlays";
import { loadAtlasData } from "@/features/characters/load";
import { buildEphemerisData } from "@/features/spotlight/build";

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
  // The one chrome of the atlas: the bar itself needs no data, but the global
  // ⌘K search does — a deliberately narrow slice of every star (see
  // SearchableCharacter) so the codex pages stay light.
  const { characters, sources } = await loadAtlasData();
  const ephemeris = await buildEphemerisData();
  const searchable = characters.map(
    ({ id, name, greekName, romanName, type, epithets, domains }) => ({
      id,
      name,
      greekName,
      romanName,
      type,
      epithets,
      domains,
    }),
  );

  return (
    <html
      lang="en"
      // Gilded is the atlas's chrome, not an option — served from the root so
      // the gold never flashes in (fourth theme review).
      data-theme="gilded"
      className={`${cinzel.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AtlasBar sources={sources} />
        {children}
        <GlobalOverlays characters={searchable} sources={sources} />
        <EphemerisHost data={ephemeris} />
        <AmbientAudio />
      </body>
    </html>
  );
}
