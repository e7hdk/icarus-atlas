/** Bakes the Greek sky — Ptolemy's 48 constellations as the atlas hangs them
 *  around the galaxy (docs/EPHEMERIS_PLAN.md §5).
 *
 *  Two sources, fetched once into research/sky/ (gitignored, reproducible):
 *
 *    · Star positions — Yale Bright Star Catalogue (BSC5). The catalogue is
 *      public domain (Harvard/ADC); the JSON packaging is MIT.
 *    · Line figures — the IAU sky culture of doinab/constellation-lines,
 *      CC BY-SA. The baked catalogue is therefore CC BY-SA too, and carries
 *      its attribution in the file itself.
 *
 *  The line data names its stars as SIMBAD ids ("* alf UMa", "* pi.03 Ori");
 *  this resolves them against the catalogue's Bayer, Flamsteed and HD columns.
 *  Star positions are stored as RA/Dec in degrees — the sky is placed on a real
 *  celestial sphere at runtime, not on a made-up plane.
 *
 *  Run with: pnpm build-sky */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..');
const RAW = path.join(ROOT, 'research', 'sky');
const OUT = path.join(ROOT, 'data', 'sky', 'constellations.json');
const USER_AGENT = 'icarus-atlas/sky-catalogue (https://icarusatlas.app)';

const SOURCES = {
  lines: {
    file: 'IAU.json',
    url: 'https://raw.githubusercontent.com/doinab/constellation-lines/master/json/IAU.json',
  },
  stars: {
    file: 'bsc5-all.json',
    url: 'https://raw.githubusercontent.com/brettonw/YaleBrightStarCatalog/master/bsc5-all.json',
  },
} as const;

/** Ptolemy's 48 — the Greek sky. Argo Navis is one constellation to Ptolemy and
 *  four to the IAU, so its quarters are stitched back into the ship below. */
const ARGO_PARTS = ['Carina', 'Puppis', 'Vela', 'Pyxis'];
const PTOLEMY = [
  'Andromeda', 'Aquarius', 'Aquila', 'Ara', 'Aries', 'Auriga', 'Bootes', 'Cancer',
  'Canis Major', 'Canis Minor', 'Capricornus', 'Cassiopeia', 'Centaurus', 'Cepheus',
  'Cetus', 'Corona Australis', 'Corona Borealis', 'Corvus', 'Crater', 'Cygnus',
  'Delphinus', 'Draco', 'Equuleus', 'Eridanus', 'Gemini', 'Hercules', 'Hydra', 'Leo',
  'Lepus', 'Libra', 'Lupus', 'Lyra', 'Ophiuchus', 'Orion', 'Pegasus', 'Perseus',
  'Pisces', 'Piscis Austrinus', 'Sagitta', 'Sagittarius', 'Scorpius', 'Serpens',
  'Taurus', 'Triangulum', 'Ursa Major', 'Ursa Minor', 'Virgo',
  ...ARGO_PARTS,
];

/** What each figure IS, in plain English — the atlas's own caption. */
const FIGURES: Record<string, string> = {
  Andromeda: 'The Chained Maiden', Aquarius: 'The Water-Pourer', Aquila: 'The Eagle',
  Ara: 'The Altar', Aries: 'The Ram', 'Argo Navis': 'The Ship Argo', Auriga: 'The Charioteer',
  Bootes: 'The Herdsman', Cancer: 'The Crab', 'Canis Major': 'The Great Dog',
  'Canis Minor': 'The Lesser Dog', Capricornus: 'The Sea-Goat', Cassiopeia: 'The Queen',
  Centaurus: 'The Centaur', Cepheus: 'The King', Cetus: 'The Sea-Monster',
  'Corona Australis': 'The Southern Crown', 'Corona Borealis': "Ariadne's Crown",
  Corvus: 'The Raven', Crater: 'The Cup', Cygnus: 'The Swan', Delphinus: 'The Dolphin',
  Draco: 'The Dragon', Equuleus: 'The Foal', Eridanus: 'The River', Gemini: 'The Twins',
  Hercules: 'The Kneeler', Hydra: 'The Water-Serpent', Leo: 'The Lion', Lepus: 'The Hare',
  Libra: 'The Scales', Lupus: 'The Beast', Lyra: "Orpheus' Lyre", Ophiuchus: 'The Serpent-Bearer',
  Orion: 'The Hunter', Pegasus: 'The Winged Horse', Perseus: 'The Champion', Pisces: 'The Fishes',
  'Piscis Austrinus': 'The Southern Fish', Sagitta: 'The Arrow', Sagittarius: 'The Archer',
  Scorpius: 'The Scorpion', Serpens: 'The Serpent', Taurus: 'The Bull',
  Triangulum: 'The Triangle', 'Ursa Major': 'The Great Bear', 'Ursa Minor': 'The Little Bear',
  Virgo: 'The Maiden',
};

/** What the ancients actually say about a figure in the sky, kept as two
 *  different claims because they ARE two different claims:
 *
 *    catasterism — this constellation IS this person or thing. Callisto was
 *      turned into a bear and set among the stars (Hyginus 177).
 *    namedIn — a saga's own telling looks up and names this constellation.
 *      Odysseus steers by the Bear (Od. 5.272–277); he is not the Bear.
 *
 *  Nothing here is inferred. There is no ancient system that assigns one
 *  character per star — the modern star names are Arabic and astronomical —
 *  so no such mapping is invented (hard rule 2). The single place where the
 *  sources DO name star by star is the Pleiades, and that is written out below. */
interface Catasterism {
  /** The figures the constellation is, where the atlas holds them and the
   *  identification is not itself in dispute. Some figures are two people
   *  (the Twins, the Fishes); some are a thing with no character at all (the
   *  Ship, the Crab); and where the ancients disagree about WHO it is, this is
   *  left empty and the competing names are laid out in the testimonia. */
  characters?: string[];
  greekName?: string;
  testimonia: string[];
}
const CATASTERISMS: Record<string, Catasterism> = {
  'Ursa Major': {
    characters: ['callisto'],
    greekName: 'Ἄρκτος',
    testimonia: [
      'Hyginus, Fabulae 177 — Callisto, changed into a bear, is put among the stars as the constellation that never sets',
      'Apollodorus 3.8.2 — Callisto in the chase with Artemis, and the wrath that followed',
      'Eratosthenes, Catasterismi 1',
    ],
  },
  Orion: {
    characters: ['orion'],
    greekName: 'Ὠρίων',
    testimonia: [
      'Homer, Odyssey 11.572–575 — Orion still hunting on the asphodel meadow',
      'Eratosthenes, Catasterismi 32',
    ],
  },
  Perseus: {
    characters: ['perseus'],
    greekName: 'Περσεύς',
    testimonia: [
      "Eratosthenes, Catasterismi 22 — Perseus set among the stars with the Gorgon's head",
      'Apollodorus 2.4.3 — Perseus, Andromeda and Cassiopeia',
    ],
  },
  Lyra: {
    // The catasterism is of the instrument, not of the man: his lyre went up,
    // Orpheus did not. The link points at its owner, the claim stays exact.
    characters: ['orpheus'],
    greekName: 'Λύρα',
    testimonia: [
      "Eratosthenes, Catasterismi 24 — the Muses gather the lyre of Orpheus and Zeus sets it among the stars",
    ],
  },
  'Argo Navis': {
    greekName: 'Ἀργώ',
    testimonia: [
      'Eratosthenes, Catasterismi 35 — the ship Argo placed in the sky, shown from the mast to the stern',
    ],
  },
  Hercules: {
    // Eratosthenes calls him only "the Kneeler" and reports the identification
    // with Heracles as one telling among others; the link carries that caution.
    characters: ['heracles'],
    greekName: 'Ἐνγόνασιν',
    testimonia: [
      'Eratosthenes, Catasterismi 4 — the Kneeler, whom some tellers name Heracles, over the dragon',
    ],
  },
  // The twelve signs, read out of Hyginus' Astronomica in the pinned corpus
  // (hard rule 5). Where Hyginus himself reports competing names, the figure is
  // left unnamed and every telling is laid out below it (hard rule 2).
  Aries: {
    greekName: 'Κριός',
    testimonia: [
      'Hyginus, Astronomica 2.20 — the ram that carried Phrixus and Helle over the Hellespont; Hesiod and Pherecydes say its fleece was of gold',
      'Apollodorus 1.9.1 — the ram of the golden fleece',
    ],
  },
  Taurus: {
    greekName: 'Ταῦρος',
    testimonia: [
      'Hyginus, Astronomica 2.21 — placed among the stars because it carried Europa safely to Crete, as Euripides says; others say it is Io, changed into a heifer',
    ],
  },
  Gemini: {
    characters: ['castor', 'polydeuces'],
    greekName: 'Δίδυμοι',
    testimonia: [
      'Hyginus, Astronomica 2.22 — many astronomers have called these stars Castor and Pollux, of all brothers the most affectionate',
    ],
  },
  Cancer: {
    greekName: 'Καρκίνος',
    testimonia: [
      'Hyginus, Astronomica 2.23 — put among the stars by the favour of Juno, because it snapped at the foot of Hercules as he stood against the Lernaean Hydra',
    ],
  },
  Leo: {
    characters: ['nemean-lion'],
    greekName: 'Λέων',
    testimonia: [
      "Hyginus, Astronomica 2.24 — set there as king of beasts; writers add that he was Hercules' first Labour, killed unarmed",
      'Apollodorus 2.5.1 — the lion of Nemea',
    ],
  },
  Virgo: {
    characters: ['dike'],
    greekName: 'Παρθένος',
    testimonia: [
      'Hyginus, Astronomica 2.25 — Hesiod calls her daughter of Jove and Themis, Aratus of Astraeus and Aurora; for her fairness she was called Justice, and led men in the Golden Age',
    ],
  },
  Libra: {
    greekName: 'Χηλαί',
    testimonia: [
      "Hyginus, Astronomica 2.26 — the Scorpion is divided in two by the spread of its claws, and one part our writers have called the Balance",
    ],
  },
  Scorpius: {
    greekName: 'Σκορπίος',
    testimonia: [
      'Hyginus, Astronomica 2.26 — the Scorpion, whose claws reach so far that the sign is counted as two',
      'Hyginus, Astronomica 2.34 — the scorpion sent against Orion, set in the sky opposite him',
    ],
  },
  Sagittarius: {
    greekName: 'Τοξότης',
    testimonia: [
      'Hyginus, Astronomica 2.27 — many have called this sign the Centaur; others deny it, since no Centaur uses arrows, and ask why he is formed with horse flanks but a Satyr’s tail',
      'Eratosthenes, Catasterismi 28 — the archer is Crotus, not Chiron',
    ],
  },
  Capricornus: {
    characters: ['pan'],
    greekName: 'Αἰγόκερως',
    testimonia: [
      'Hyginus, Astronomica 2.28 — the sign resembles Aegipan, nursed with Jupiter, who first cast among the Titans the fear that is called panic; his lower body is a fish because he hurled shellfish at the enemy',
    ],
  },
  Aquarius: {
    greekName: 'Ὑδροχόος',
    testimonia: [
      'Hyginus, Astronomica 2.29 — many say he is Ganymede, made cupbearer of the gods, shown pouring from an urn; Hegesianax says Deucalion, in whose reign the Flood came; Eubulus says Cecrops',
    ],
  },
  Pisces: {
    characters: ['aphrodite', 'eros'],
    greekName: 'Ἰχθύες',
    testimonia: [
      'Hyginus, Astronomica 2.30 — Diognetus Erythraeus tells that Venus and her son Cupid, meeting Typhon by the Euphrates, threw themselves into the river and took the form of fishes',
    ],
  },
  Pleiades: {
    greekName: 'Πλειάδες',
    testimonia: [
      'Apollodorus 3.10.1 — Atlas and Pleione had seven daughters called the Pleiades: Alcyone, Merope, Celaeno, Electra, Sterope, Taygete and Maia',
      'Homer, Iliad 18.485 — the Pleiades among the constellations on the shield',
    ],
  },
};

/** Sagas whose own telling looks up and names the figure. */
const NAMED_IN: Record<string, { story: string; testimonia: string[] }[]> = {
  Aries: [
    {
      story: 'golden-fleece',
      testimonia: ['Hyginus, Astronomica 2.20 — the ram of Phrixus and Helle, whose fleece the Argonauts sought'],
    },
  ],
  Taurus: [
    {
      story: 'europa-and-the-bull',
      testimonia: ['Hyginus, Astronomica 2.21 — the bull that carried Europa to Crete'],
    },
  ],
  Cancer: [
    {
      story: 'heracles-cycle',
      testimonia: ['Hyginus, Astronomica 2.23 — the crab at the Lernaean Hydra'],
    },
  ],
  Scorpius: [
    {
      story: 'orion-the-hunter',
      testimonia: ['Hyginus, Astronomica 2.34 — the scorpion set in the sky opposite Orion'],
    },
  ],
  Capricornus: [
    {
      story: 'titanomachy',
      testimonia: ['Hyginus, Astronomica 2.28 — Aegipan casting panic among the Titans'],
    },
  ],
  Aquarius: [
    {
      story: 'ganymede',
      testimonia: ['Hyginus, Astronomica 2.29 — many say the Water Bearer is Ganymede'],
    },
    {
      story: 'great-flood',
      testimonia: ['Hyginus, Astronomica 2.29 — Hegesianax says he is Deucalion, in whose reign the Flood came'],
    },
  ],
  Pisces: [
    {
      story: 'typhonomachy',
      testimonia: ['Hyginus, Astronomica 2.30 — Venus and Cupid taking fish form to escape Typhon'],
    },
  ],
  'Ursa Major': [
    {
      story: 'odyssey',
      testimonia: [
        'Homer, Odyssey 5.272–277 — Calypso bids Odysseus keep the Bear, which men also call the Wain, on his left hand as he sails',
      ],
    },
  ],
  Orion: [
    {
      story: 'orion-the-hunter',
      testimonia: ['Homer, Odyssey 5.121–124 — Orion and the anger of the gods'],
    },
  ],
  'Argo Navis': [
    {
      story: 'argonautica',
      testimonia: ['Apollonius Rhodius, Argonautica 1.111–114 — Athena builds the Argo'],
    },
  ],
  Lyra: [
    {
      story: 'orpheus-cycle',
      testimonia: ['Eratosthenes, Catasterismi 24 — the lyre is Orpheus\' own'],
    },
  ],
  Perseus: [
    { story: 'perseus-cycle', testimonia: ['Apollodorus 2.4.3 — the Perseus cycle'] },
  ],
  Hercules: [
    { story: 'heracles-cycle', testimonia: ['Eratosthenes, Catasterismi 4'] },
  ],
};

/** Stars the sources name as people, by the star's own catalogue name. The
 *  Twins are the clearest case in the zodiac: the two bright stars have carried
 *  the brothers' names since antiquity. */
const STAR_CAST: Record<string, Record<string, string>> = {
  Gemini: { Castor: 'castor', Pollux: 'polydeuces' },
};

/** The one asterism the sources name star by star. The seven sisters stand in
 *  the shoulder of the Bull; the atlas holds all seven as characters, so here —
 *  and only here — a star IS a person. */
const PLEIADES = {
  name: 'Pleiades',
  figure: 'The Seven Sisters',
  iau: ['Tau'],
  asterism: 'Taurus',
  /** Flamsteed number in Taurus → the atlas character standing in that star. */
  cast: {
    '25': 'alcyone-pleiad',
    '23': 'merope-pleiad',
    '16': 'celaeno-pleiad',
    '17': 'electra-pleiad',
    '21': 'sterope-pleiad',
    '19': 'taygete',
    '20': 'maia',
  } as Record<string, string>,
  /** The little dipper the cluster draws, in the order the stars are gathered. */
  lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]] as [number, number][],
};


/** How each figure came to the sky, told as the atlas tells everything else:
 *  sourced paragraphs with their citation, so the lens system can read them.
 *  Every one is drawn from Hyginus' Astronomica in the pinned corpus (hard
 *  rule 5); where Hyginus himself reports rival names, the paragraph says so
 *  rather than choosing (hard rule 2). */
interface Origin {
  text: string;
  sources: string[];
  citation?: string;
}
const ORIGINS: Record<string, Origin[]> = {
  'Ursa Major': [
    {
      text: 'Callisto followed Artemis in the chase and swore to stay a maid; Zeus came to her all the same, and for the child she bore she was turned into a bear. Jupiter set her among the stars afterwards, in the one place in the sky that never sinks into the sea — she wheels there and never sets.',
      sources: ['hyginus', 'apollodorus'],
      citation: 'Astronomica 2.1; Bibliotheca 3.8.2',
    },
  ],
  Orion: [
    {
      text: 'The hunter who was too great for the earth was set opposite the beast that killed him: the Scorpion rises as Orion goes down, so that the two never share the sky. He hunts still, Homer saw him, driving the beasts he had killed on the lonely hills.',
      sources: ['hyginus', 'homer'],
      citation: 'Astronomica 2.34; Odyssey 11.572–575',
    },
  ],
  Lyra: [
    {
      text: 'When Orpheus was torn apart, the Muses gathered what was left of him and buried it, and the lyre they carried up to Zeus, who set it among the stars. The instrument went to heaven; the man did not.',
      sources: ['hyginus'],
      citation: 'Astronomica 2.7',
    },
  ],
  'Argo Navis': [
    {
      text: 'The first ship ever built for the open sea was put into the sky when her voyage was done — and she is shown from the mast to the stern only, the prow left out of the stars, so that a ship already through the Clashing Rocks should not seem to be sailing into anything again.',
      sources: ['hyginus'],
      citation: 'Astronomica 2.37',
    },
  ],
  Perseus: [
    {
      text: 'He stands in the sky as he stood in life, the Gorgon\'s head still in his hand — and the head keeps its own star, the one that dims and brightens, which later watchers called the Demon.',
      sources: ['hyginus', 'apollodorus'],
      citation: 'Astronomica 2.12; Bibliotheca 2.4.3',
    },
  ],
  Hercules: [
    {
      text: 'The oldest name for this figure is simply the Kneeler — a man on one knee, fighting something the sky does not name. Later tellers gave him the club and the lion skin and called him Heracles, over the dragon he killed at the world\'s western edge.',
      sources: ['hyginus'],
      citation: 'Astronomica 2.6',
    },
  ],
  Pleiades: [
    {
      text: 'Seven daughters of Atlas and Pleione, born in Arcadia: Alcyone, Merope, Celaeno, Electra, Sterope, Taygete and Maia. They are the one company in the Greek sky the sources count star by star — and only six are easily seen, for Merope, who married a mortal, hides her light.',
      sources: ['apollodorus', 'hyginus'],
      citation: 'Bibliotheca 3.10.1; Astronomica 2.21',
    },
  ],
  Aries: [
    {
      text: 'The ram with the golden fleece carried Phrixus and Helle away from their stepmother; Helle fell into the strait that still bears her name, and the ram brought the boy safe to Colchis. Its fleece hung in the grove there until the Argonauts came for it, and the ram itself went up among the stars.',
      sources: ['hyginus', 'apollodorus'],
      citation: 'Astronomica 2.20; Bibliotheca 1.9.1',
    },
  ],
  Taurus: [
    {
      text: 'A bull swam to Crete with Europa on his back, and was set in the sky for it — so Euripides says. Others tell it otherwise: that this is Io, changed into a heifer, and that Jupiter put her among the constellations to make amends for what he had done to her.',
      sources: ['hyginus'],
      citation: 'Astronomica 2.21',
    },
  ],
  Gemini: [
    {
      text: 'Of all brothers these two were the most affectionate, never striving against one another for the leadership, never acting without the other. For that the astronomers set Castor and Pollux side by side, each with his own star, and neither the brighter for long.',
      sources: ['hyginus'],
      citation: 'Astronomica 2.22',
    },
  ],
  Cancer: [
    {
      text: 'While Hercules stood in the swamp against the Lernaean Hydra, a crab came out of the water and snapped at his foot. He crushed it — and Juno, who wished him no good, set the little creature among the stars for its one moment of service.',
      sources: ['hyginus'],
      citation: 'Astronomica 2.23',
    },
  ],
  Leo: [
    {
      text: 'He is in the sky because he is king of beasts; and writers add that he was the first Labour, the lion whose hide no weapon would cut, so that Hercules had to kill him unarmed and with his hands.',
      sources: ['hyginus', 'apollodorus'],
      citation: 'Astronomica 2.24; Bibliotheca 2.5.1',
    },
  ],
  Virgo: [
    {
      text: 'She lived among men in the Golden Age and led them, and for her fairness they called her Justice. Then the races grew worse, and she went up out of the world into the stars — Hesiod makes her the daughter of Zeus and Themis, Aratus of Astraeus and the Dawn.',
      sources: ['hyginus', 'hesiod'],
      citation: 'Astronomica 2.25',
    },
  ],
  Libra: [
    {
      text: 'To the Greeks this was not a figure of its own but the Claws — the Scorpion reaches so far across the sky that its grasp was counted as a second sign. Later writers weighed the two halves against each other and called this one the Balance.',
      sources: ['hyginus'],
      citation: 'Astronomica 2.26',
    },
  ],
  Scorpius: [
    {
      text: 'The scorpion came out of the ground against Orion and killed him, and both were set in the sky — but set apart, at opposite ends of the year, so that the hunter goes down as the beast comes up and they are never in the sky together.',
      sources: ['hyginus'],
      citation: 'Astronomica 2.26; 2.34',
    },
  ],
  Sagittarius: [
    {
      text: 'Many call this figure the Centaur, and many deny it — no Centaur ever used a bow, and this one has the flanks of a horse but the tail of a Satyr. Eratosthenes names him Crotus instead, who lived with the Muses on Helicon and invented applause.',
      sources: ['hyginus'],
      citation: 'Astronomica 2.27',
    },
  ],
  Capricornus: [
    {
      text: 'Aegipan was nursed alongside Jupiter, and when the Titans attacked he was the one who threw among them the terror that is still called panic. He is a goat above and a fish below, because he flung shellfish at the enemy out of the sea.',
      sources: ['hyginus'],
      citation: 'Astronomica 2.28',
    },
  ],
  Aquarius: [
    {
      text: 'A figure pouring water endlessly from a jar, and no agreement about who he is. Many say Ganymede, snatched up for his beauty to be cupbearer of the gods. Hegesianax says Deucalion, in whose reign so much water came down from the sky that the Flood followed. Eubulus says Cecrops, older than wine, who poured water at the altars.',
      sources: ['hyginus'],
      citation: 'Astronomica 2.29',
    },
  ],
  Pisces: [
    {
      text: 'Venus and her son Cupid were at the Euphrates when Typhon appeared, and they threw themselves into the river and took the shape of fishes to escape him. Two fishes went into the sky for it, tied together by the tail so that they should never again be parted.',
      sources: ['hyginus'],
      citation: 'Astronomica 2.30',
    },
  ],
};

const GREEK: Record<string, string> = {
  alf: 'α', bet: 'β', gam: 'γ', del: 'δ', eps: 'ε', zet: 'ζ', eta: 'η', tet: 'θ',
  iot: 'ι', kap: 'κ', lam: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', ksi: 'ξ', omi: 'ο', pi: 'π',
  rho: 'ρ', sig: 'σ', tau: 'τ', ups: 'υ', phi: 'φ', chi: 'χ', psi: 'ψ', ome: 'ω',
};
const SUPERSCRIPT = ['', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];

interface CatalogueStar {
  Bayer?: string;
  Common?: string;
  Constellation?: string;
  Flamsteed?: string;
  HD?: string;
  RA?: string;
  Dec?: string;
  Vmag?: string;
}

async function source(entry: { file: string; url: string }): Promise<unknown> {
  const local = path.join(RAW, entry.file);
  if (!existsSync(local)) {
    await mkdir(RAW, { recursive: true });
    process.stdout.write(`  fetching ${entry.file} …`);
    const response = await fetch(entry.url, { headers: { 'User-Agent': USER_AGENT } });
    if (!response.ok) throw new Error(`${entry.url}: HTTP ${response.status}`);
    await writeFile(local, await response.text());
    process.stdout.write(' done\n');
  }
  return JSON.parse(await readFile(local, 'utf-8'));
}

/** Degrees from the catalogue's sexagesimal strings. */
function rightAscension(star: CatalogueStar): number | null {
  const m = star.RA?.match(/(\d+)h\s*(\d+)m\s*([\d.]+)s/);
  return m ? (Number(m[1]) + Number(m[2]) / 60 + Number(m[3]) / 3600) * 15 : null;
}
function declination(star: CatalogueStar): number | null {
  const m = star.Dec?.match(/([+-])(\d+)°\s*(\d+)′\s*([\d.]+)″/);
  return m
    ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) + Number(m[3]) / 60 + Number(m[4]) / 3600)
    : null;
}

async function main() {
  const [lineData, catalogue] = (await Promise.all([source(SOURCES.lines), source(SOURCES.stars)])) as [
    { constellations: { names?: { english?: string }[]; lines?: string[][]; IAU?: string }[] },
    CatalogueStar[],
  ];

  const byBayer = new Map<string, CatalogueStar>();
  const byLetter = new Map<string, CatalogueStar[]>();
  const byFlamsteed = new Map<string, CatalogueStar>();
  const byHd = new Map<string, CatalogueStar>();
  for (const star of catalogue) {
    if (!star.Constellation || rightAscension(star) === null || declination(star) === null) continue;
    if (star.Bayer) {
      const key = `${star.Constellation}|${star.Bayer}`;
      if (!byBayer.has(key)) byBayer.set(key, star);
      const bare = `${star.Constellation}|${star.Bayer.replace(/[¹²³⁴⁵⁶⁷⁸⁹]/g, '')}`;
      byLetter.set(bare, [...(byLetter.get(bare) ?? []), star]);
    }
    if (star.Flamsteed) {
      const key = `${star.Constellation}|F${star.Flamsteed}`;
      if (!byFlamsteed.has(key)) byFlamsteed.set(key, star);
    }
    if (star.HD && !byHd.has(String(star.HD))) byHd.set(String(star.HD), star);
  }

  /** "* pi.03 Ori" · "*  11 Ori" · "* HD 12345" · "* alf Cen A" */
  function resolve(ref: string): CatalogueStar | null {
    const body = ref.replace(/^\*\s+/, '').replace(/\s+[A-Z]$/, '').trim();
    const hd = body.match(/^HD\s*(\d+)/i);
    if (hd) return byHd.get(hd[1]!) ?? null;
    const flamsteed = body.match(/^(\d+)\s+(\w+)$/);
    if (flamsteed) return byFlamsteed.get(`${flamsteed[2]}|F${flamsteed[1]}`) ?? null;
    const m = body.match(/^([A-Za-z]+)\.?(\d*)\s+(\w+)$/);
    if (!m) return null;
    const constellation = m[3]!;
    const letter = GREEK[m[1]!.toLowerCase()] ?? m[1]!;
    const index = m[2] ? Number(m[2]) : 0;
    const exact =
      byBayer.get(`${constellation}|${letter}${SUPERSCRIPT[index] ?? ''}`) ??
      byBayer.get(`${constellation}|${letter}`);
    if (exact) return exact;
    // "tau Aqr" with no number, where the sky holds only τ¹ and τ²: the first
    // stands for it. A NUMBERED reference must never fall back this way, or two
    // different stars would collapse into one.
    return index === 0 ? (byLetter.get(`${constellation}|${letter}`)?.[0] ?? null) : null;
  }

  const slug = (name: string) =>
    name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-');

  interface Bucket {
    name: string;
    iau: string[];
    stars: Map<string, CatalogueStar>;
    lines: string[][];
  }
  const gathered = new Map<string, Bucket>();
  let refs = 0;
  let unresolved = 0;
  const missing = new Set<string>();

  for (const entry of lineData.constellations) {
    const english = entry.names?.[0]?.english;
    if (!english || !PTOLEMY.includes(english)) continue;
    // Ptolemy's ship, reassembled from the quarters the IAU broke it into.
    const name = ARGO_PARTS.includes(english) ? 'Argo Navis' : english;
    const bucket: Bucket = gathered.get(name) ?? { name, iau: [], stars: new Map(), lines: [] };
    if (entry.IAU) bucket.iau.push(entry.IAU);
    for (const polyline of entry.lines ?? []) {
      const walked: string[] = [];
      for (const ref of polyline) {
        refs += 1;
        const star = resolve(ref);
        if (!star) {
          unresolved += 1;
          missing.add(ref);
          walked.push(''); // a hole: the figure is cut here rather than invented across
          continue;
        }
        bucket.stars.set(ref, star);
        walked.push(ref);
      }
      bucket.lines.push(walked);
    }
    gathered.set(name, bucket);
  }

  const constellations = [...gathered.values()]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((bucket) => {
      const order = [...bucket.stars.keys()];
      const index = new Map(order.map((ref, i) => [ref, i]));
      const segments: [number, number][] = [];
      for (const polyline of bucket.lines) {
        for (let i = 0; i < polyline.length - 1; i += 1) {
          const from = index.get(polyline[i]!);
          const to = index.get(polyline[i + 1]!);
          if (from === undefined || to === undefined || from === to) continue;
          segments.push([from, to]);
        }
      }
      const catasterism = CATASTERISMS[bucket.name];
      const namedIn = NAMED_IN[bucket.name];
      return {
        id: slug(bucket.name),
        name: bucket.name,
        figure: FIGURES[bucket.name] ?? bucket.name,
        iau: bucket.iau.sort(),
        ...(catasterism?.greekName ? { greekName: catasterism.greekName } : {}),
        ...(catasterism
          ? {
              catasterism: {
                ...(catasterism.characters ? { characters: catasterism.characters } : {}),
                testimonia: catasterism.testimonia,
              },
            }
          : {}),
        ...(namedIn ? { namedIn } : {}),
        ...(ORIGINS[bucket.name] ? { origin: ORIGINS[bucket.name] } : {}),
        stars: order.map((ref) => {
          const star = bucket.stars.get(ref)!;
          const name = star.Common || `${star.Bayer ?? star.Flamsteed ?? '?'} ${star.Constellation}`;
          const character = STAR_CAST[bucket.name]?.[name];
          return {
            ...(character ? { character } : {}),
            name,
            bayer: star.Bayer ?? '',
            ra: Number(rightAscension(star)!.toFixed(4)),
            dec: Number(declination(star)!.toFixed(4)),
            mag: Number(star.Vmag ?? '6'),
          };
        }),
        lines: segments,
      };
    });

  // The seven sisters, gathered by Flamsteed number out of the Bull's shoulder.
  const sisters = Object.entries(PLEIADES.cast)
    .map(([flamsteed, character]) => ({ star: byFlamsteed.get(`Tau|F${flamsteed}`), character }))
    .filter((entry): entry is { star: CatalogueStar; character: string } => Boolean(entry.star))
    .sort((a, b) => Number(a.star.Vmag ?? 9) - Number(b.star.Vmag ?? 9));
  if (sisters.length === Object.keys(PLEIADES.cast).length) {
    const pleiades = CATASTERISMS.Pleiades!;
    constellations.push({
      id: 'pleiades',
      name: PLEIADES.name,
      figure: PLEIADES.figure,
      iau: PLEIADES.iau,
      asterism: PLEIADES.asterism,
      greekName: pleiades.greekName,
      catasterism: { testimonia: pleiades.testimonia },
      origin: ORIGINS.Pleiades,
      stars: sisters.map(({ star, character }) => ({
        name: star.Common ?? `${star.Flamsteed} Tau`,
        bayer: star.Bayer ?? '',
        ra: Number(rightAscension(star)!.toFixed(4)),
        dec: Number(declination(star)!.toFixed(4)),
        mag: Number(star.Vmag ?? '6'),
        character,
      })),
      lines: PLEIADES.lines,
    } as (typeof constellations)[number]);
    constellations.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    console.log('  the Pleiades were not all in the catalogue — the asterism is skipped');
  }

  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(
    OUT,
    `${JSON.stringify(
      {
        note:
          "Ptolemy's 48 constellations — the Greek sky — baked by scripts/build-sky.ts. " +
          'Star positions are RA/Dec in degrees (equinox 2000), so the sky is hung on a real ' +
          'celestial sphere around the galaxy rather than on an invented plane. `lines` are ' +
          'the classical figure as index pairs into `stars`. A constellation carries `story` ' +
          'only where the ancients record the catasterism, with its testimonia; the rest are ' +
          'simply the sky.',
        attribution: {
          lines: {
            work: 'constellation-lines — IAU sky culture',
            author: 'Doina Bucur',
            url: 'https://github.com/doinab/constellation-lines',
            licence: 'CC BY-SA',
            note: 'This catalogue is a derivative and is therefore CC BY-SA.',
          },
          positions: {
            work: 'Yale Bright Star Catalogue, 5th revised edition',
            author: 'Hoffleit & Warren, Astronomical Data Center',
            url: 'http://tdc-www.harvard.edu/catalogs/bsc5.html',
            licence: 'public domain (JSON packaging MIT: brettonw/YaleBrightStarCatalog)',
          },
        },
        constellations,
      },
      null,
      2,
    )}\n`,
  );

  const holes = constellations.filter((c) => c.stars.length > 0);
  console.log(
    `Sky baked → data/sky/constellations.json\n` +
      `  ${constellations.length} constellations · ${holes.reduce((n, c) => n + c.stars.length, 0)} stars · ` +
      `${refs} references, ${unresolved} unresolved (${((100 * unresolved) / refs).toFixed(1)}%)`,
  );
  if (missing.size > 0) {
    console.log(`  unresolved designations: ${[...missing].sort().join(', ')}`);
  }
  const told = constellations.filter((c) => 'catasterism' in c);
  const inSagas = constellations.filter((c) => 'namedIn' in c);
  console.log(`  catasterisms recorded: ${told.map((c) => c.name).join(', ')}`);
  console.log(`  named in a saga's own telling: ${inSagas.map((c) => c.name).join(', ')}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
