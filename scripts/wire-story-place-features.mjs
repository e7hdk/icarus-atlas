#!/usr/bin/env node
/**
 * Add curated mountain features and wire story places[].featureId.
 * Run: node scripts/wire-story-place-features.mjs [--dry-run]
 */
import fs from 'fs';
import path from 'path';

const DRY = process.argv.includes('--dry-run');
const DATA = path.join(process.cwd(), 'data');
const STORIES_DIR = path.join(DATA, 'stories');
const FEATURES_FILE = path.join(DATA, 'geo/features.json');

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

function poly(coords) {
  return { type: 'Polygon', coordinates: [coords] };
}

/** New mountains missing from features.json (LANDS batch). */
const NEW_FEATURES = [
  {
    id: 'mount-dicte',
    name: 'Dicte',
    greekName: 'Δίκτη',
    kind: 'mountain-range',
    geometry: poly([
      [25.38, 35.18],
      [25.52, 35.16],
      [25.54, 35.08],
      [25.46, 35.04],
      [25.36, 35.08],
      [25.38, 35.18],
    ]),
    region: 'crete',
    importance: 'major',
    summary: [
      {
        text: 'Dicte — the Cretan mountain whose cave received Zeus when Rhea hid her last-born from Cronus; the Curetes clashed their arms over the infant king.',
        sources: ['hesiod', 'apollodorus', 'pausanias'],
        citation: 'Theogony 477-484; Bibliotheca 1.1.6-7; Description of Greece 8.53.2',
      },
    ],
    sources: ['hesiod', 'apollodorus', 'pausanias'],
  },
  {
    id: 'mount-ida-crete',
    name: 'Ida',
    greekName: 'Ἴδη',
    kind: 'mountain-range',
    geometry: poly([
      [24.72, 35.28],
      [24.92, 35.26],
      [24.96, 35.12],
      [24.82, 35.06],
      [24.68, 35.12],
      [24.72, 35.28],
    ]),
    region: 'crete',
    importance: 'major',
    summary: [
      {
        text: "Mount Ida of Crete — the island peak where some Cretans placed Zeus' birth and where the nymph Ida nursed the hidden child beside Adrasteia, rival holy cave to Dicte in local tradition.",
        sources: ['apollodorus', 'pausanias'],
        citation: 'Bibliotheca 1.1.6-7; Description of Greece 8.53.2',
      },
    ],
    sources: ['apollodorus', 'pausanias'],
  },
  {
    id: 'mount-tmolus',
    name: 'Tmolus',
    greekName: 'Τμῶλος',
    kind: 'mountain-range',
    geometry: poly([
      [27.62, 38.62],
      [27.78, 38.6],
      [27.8, 38.5],
      [27.68, 38.46],
      [27.58, 38.52],
      [27.62, 38.62],
    ]),
    region: 'lydia',
    importance: 'major',
    summary: [
      {
        text: 'Tmolus — the Lydian mountain whose king judged the contest of Marsyas and Apollo, and where Midas learned the limits of mortal ears beside the god of song.',
        sources: ['ovid', 'apollodorus', 'hyginus'],
        citation: 'Metamorphoses 11.150-193; Bibliotheca 1.4.2; Fabulae 165',
      },
    ],
    sources: ['ovid', 'apollodorus', 'hyginus'],
  },
  {
    id: 'mount-sipylus',
    name: 'Sipylus',
    greekName: 'Σίπυλος',
    kind: 'mountain-range',
    geometry: poly([
      [27.42, 38.64],
      [27.58, 38.62],
      [27.6, 38.52],
      [27.48, 38.48],
      [27.38, 38.54],
      [27.42, 38.64],
    ]),
    region: 'lydia',
    importance: 'major',
    summary: [
      {
        text: "Sipylus — the Lydian mountain of Niobe's pride, where the weeping stone still marks the queen who challenged Leto's children and was turned to grief on her native height.",
        sources: ['homer', 'ovid', 'pausanias'],
        citation: 'Iliad 24.602-620; Metamorphoses 6.146-312; Description of Greece 1.21.3',
      },
    ],
    sources: ['homer', 'ovid', 'pausanias'],
  },
  {
    id: 'mount-cyllene',
    name: 'Cyllene',
    greekName: 'Κυλλήνη',
    kind: 'mountain-range',
    geometry: poly([
      [22.3, 38.0],
      [22.42, 37.98],
      [22.44, 37.9],
      [22.34, 37.86],
      [22.26, 37.92],
      [22.3, 38.0],
    ]),
    region: 'arcadia',
    importance: 'major',
    summary: [
      {
        text: 'Cyllene — the Arcadian mountain and cave where Maia bore Hermes at dawn and where the god of thieves first fashioned his lyre from a tortoise shell.',
        sources: ['hesiod', 'homer', 'pausanias'],
        citation: 'Theogony 938-939; Homeric Hymn to Hermes 1-22; Description of Greece 8.17.5',
      },
    ],
    sources: ['hesiod', 'homer', 'pausanias'],
  },
  {
    id: 'mount-nysa',
    name: 'Nysa',
    greekName: 'Νῦσα',
    kind: 'mountain-range',
    geometry: poly([
      [24.82, 41.52],
      [24.98, 41.5],
      [25.0, 41.4],
      [24.88, 41.36],
      [24.78, 41.42],
      [24.82, 41.52],
    ]),
    region: 'thrace',
    importance: 'major',
    summary: [
      {
        text: "Nysa — the mountain of Dionysus' Thracian nurses, where Lycurgus met the god's madness and where Zeus hid the babe in his thigh until the birth at term.",
        sources: ['homer', 'apollodorus', 'hyginus'],
        citation: 'Iliad 6.130-140; Bibliotheca 3.4.3, 3.5.1; Fabulae 132',
      },
    ],
    sources: ['homer', 'apollodorus', 'hyginus'],
  },
  {
    id: 'mount-erymanthus',
    name: 'Erymanthus',
    greekName: 'Ἐρύμανθος',
    kind: 'mountain-range',
    geometry: poly([
      [21.72, 37.82],
      [21.88, 37.8],
      [21.9, 37.7],
      [21.78, 37.66],
      [21.66, 37.72],
      [21.72, 37.82],
    ]),
    region: 'arcadia',
    importance: 'minor',
    summary: [
      {
        text: 'Erymanthus — the Arcadian mountain whose woods sheltered Callisto when Arcas nearly struck his transformed mother, and whose boar Heracles hunted in his labours.',
        sources: ['ovid', 'apollodorus', 'pausanias'],
        citation: 'Metamorphoses 2.401-530; Bibliotheca 2.5.4; Description of Greece 8.24.5',
      },
    ],
    sources: ['ovid', 'apollodorus', 'pausanias'],
  },
  {
    id: 'mount-hymettus',
    name: 'Hymettus',
    greekName: 'Ὑμηττός',
    kind: 'mountain-range',
    geometry: poly([
      [23.74, 38.0],
      [23.86, 37.98],
      [23.88, 37.9],
      [23.78, 37.86],
      [23.7, 37.92],
      [23.74, 38.0],
    ]),
    region: 'attica',
    importance: 'minor',
    summary: [
      {
        text: "Hymettus — the Attic height above Athens where Cephalus hunted and called upon the breeze, and where the city's marble and honey were named in proverb.",
        sources: ['ovid', 'pausanias'],
        citation: 'Metamorphoses 7.661-865; Description of Greece 1.32.2',
      },
    ],
    sources: ['ovid', 'pausanias'],
  },
  {
    id: 'mount-caphareus',
    name: 'Caphareus',
    greekName: 'Καφήρεας',
    kind: 'mountain-range',
    geometry: poly([
      [24.16, 38.2],
      [24.28, 38.18],
      [24.3, 38.1],
      [24.2, 38.06],
      [24.12, 38.12],
      [24.16, 38.2],
    ]),
    region: 'euboea',
    importance: 'minor',
    summary: [
      {
        text: 'Caphareus — the Euboean headland where Nauplius kindled the false beacon that wrecked the Greek fleet on the homeward sea, punishing the killers of Palamedes.',
        sources: ['apollodorus', 'hyginus', 'pausanias'],
        citation: 'Epitome 6.11; Fabulae 116; Description of Greece 4.23.7',
      },
    ],
    sources: ['apollodorus', 'hyginus', 'pausanias'],
  },
  {
    id: 'mount-rhodope',
    name: 'Rhodope',
    greekName: 'Ῥοδόπη',
    kind: 'mountain-range',
    geometry: poly([
      [24.55, 41.75],
      [25.1, 41.7],
      [25.35, 41.55],
      [25.05, 41.35],
      [24.6, 41.3],
      [24.4, 41.5],
      [24.55, 41.75],
    ]),
    region: 'thrace',
    importance: 'major',
    summary: [
      {
        text: "Rhodope — the snow-clad Thracian mountain of Orpheus' mourning, where the bard of Rhodope shunned all women after Eurydice's death and where the Ciconian women drowned his voice in Bacchic clamour.",
        sources: ['ovid', 'hyginus', 'apollodorus'],
        citation: 'Metamorphoses 10.1-66, 11.1-66; Fabulae 132; Bibliotheca 1.3.2',
      },
    ],
    sources: ['ovid', 'hyginus', 'apollodorus'],
  },
];

/** Strait of Messina centreline (matches sync-river-geometry.ts SCYLLA_CHARYBDIS_STATIONS). */
const SCYLLA_CHARYBDIS_LINE = [
  [15.65, 38.02],
  [15.6, 38.05],
  [15.55, 38.08],
  [15.5, 38.1],
  [15.46, 38.12],
  [15.42, 38.14],
  [15.38, 38.16],
  [15.34, 38.18],
  [15.3, 38.2],
  [15.28, 38.21],
];

/** Hellespont centreline (matches sync-river-geometry.ts HELLESPONT_STATIONS). */
const HELLESPONT_LINE = [
  [26.066, 39.997],
  [26.115, 40.03],
  [26.168, 40.068],
  [26.225, 40.108],
  [26.288, 40.15],
  [26.355, 40.192],
  [26.395, 40.215],
  [26.448, 40.248],
  [26.505, 40.285],
  [26.565, 40.322],
  [26.625, 40.355],
  [26.669, 40.386],
];

/** Strait / gulf / river features for story place backfill. */
const NEW_HYDRO_FEATURES = [
  {
    id: 'hellespont',
    name: 'Hellespont',
    greekName: 'Ἑλλήσποντος',
    kind: 'strait',
    geometry: { type: 'LineString', coordinates: HELLESPONT_LINE },
    region: 'troad',
    importance: 'major',
    summary: [
      {
        text: 'The Hellespont — the narrow strait between Europe and Asia where Helle fell from the golden ram and Phrixus alone rode on to Colchis.',
        sources: ['apollodorus', 'apollonius', 'ovid'],
        citation: 'Bibliotheca 1.9.1; Argonautica 1.927-929; Metamorphoses 6.676-681',
      },
    ],
    sources: ['apollodorus', 'apollonius', 'ovid'],
  },
  {
    id: 'hebrus',
    name: 'Hebrus',
    greekName: 'Ἕβρος',
    kind: 'river',
    geometry: {
      type: 'LineString',
      coordinates: [
        [24.85, 41.65],
        [25.2, 41.58],
        [25.75, 41.52],
        [26.55, 41.67],
        [26.35, 41.25],
        [26.05, 41.0],
        [25.98, 40.85],
      ],
    },
    region: 'thrace',
    importance: 'major',
    summary: [
      {
        text: "Hebrus — the Thracian river that bore Orpheus' severed head and lyre still murmuring Eurydice, and carried the bard's song to the Aegean shore.",
        sources: ['ovid', 'apollodorus', 'pausanias'],
        citation: 'Metamorphoses 11.1-66; Bibliotheca 1.3.2; Description of Greece 9.30.4',
      },
    ],
    sources: ['ovid', 'apollodorus', 'pausanias'],
  },
  {
    id: 'symplegades',
    name: 'Symplegades',
    greekName: 'Συμπληγάδες',
    kind: 'strait',
    geometry: {
      type: 'LineString',
      coordinates: [
        [29.02, 41.02],
        [29.08, 41.08],
        [29.14, 41.14],
        [29.2, 41.2],
      ],
    },
    region: null,
    importance: 'major',
    summary: [
      {
        text: 'The Symplegades — the Clashing Rocks at the mouth of the Euxine Sea, which smashed together on any ship until the Argo passed and they stood fixed forever.',
        sources: ['apollodorus', 'apollonius', 'hyginus'],
        citation: 'Bibliotheca 1.9.22; Argonautica 2.549-610; Fabulae 17',
      },
    ],
    sources: ['apollodorus', 'apollonius', 'hyginus'],
  },
  {
    id: 'propontis',
    name: 'Propontis',
    greekName: 'Προποντίς',
    kind: 'gulf',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [26.25, 40.05],
          [27.2, 40.0],
          [28.8, 40.35],
          [29.45, 40.95],
          [29.15, 41.2],
          [27.4, 41.15],
          [26.4, 40.85],
          [26.25, 40.05],
        ],
      ],
    },
    region: null,
    importance: 'major',
    summary: [
      {
        text: "The Propontis — the sea between the Hellespont and the Bosporus where the Doliones welcomed the Argonauts and Jason's men slew their host Cyzicus in a night of mistaken battle.",
        sources: ['apollodorus', 'apollonius', 'hyginus'],
        citation: 'Bibliotheca 1.9.18; Argonautica 1.936-1077; Fabulae 14',
      },
    ],
    sources: ['apollodorus', 'apollonius', 'hyginus'],
  },
  {
    id: 'scylla-charybdis',
    name: 'Scylla and Charybdis',
    greekName: 'Σκύλλη καὶ Χάρυβδις',
    kind: 'strait',
    geometry: { type: 'LineString', coordinates: SCYLLA_CHARYBDIS_LINE },
    region: null,
    importance: 'major',
    summary: [
      {
        text: 'The narrow strait where Scylla snatched six men from Odysseus\' benches and Charybdis thrice sucked the sea into her whirlpool — the peril Circe warned of after the Sirens, and where Ovid set the cliff-monster Glaucus\' maiden became.',
        sources: ['homer', 'apollodorus', 'ovid'],
        citation: 'Odyssey 12.235-275; Epitome 7.18-23; Metamorphoses 13.898-14.74',
      },
    ],
    sources: ['homer', 'apollodorus', 'ovid'],
  },
  {
    id: 'gyraean-rocks',
    name: 'Gyraean rocks',
    greekName: 'Γυραῖαι πέτραι',
    kind: 'strait',
    geometry: {
      type: 'LineString',
      coordinates: [
        [24.08, 38.48],
        [24.12, 38.52],
        [24.16, 38.55],
        [24.2, 38.58],
      ],
    },
    region: 'euboea',
    importance: 'major',
    summary: [
      {
        text: 'The Gyraean rocks — the reef off Euboea where Poseidon drove Ajax son of Oileus after the sack of Troy, and where his boast that he was saved despite Athena sealed his doom when the god split the rock with his trident.',
        sources: ['homer', 'apollodorus', 'hyginus'],
        citation: 'Odyssey 4.499-511; Epitome 6.6; Fabulae 116',
      },
    ],
    sources: ['homer', 'apollodorus', 'hyginus'],
  },
  {
    id: 'capherian-rocks',
    name: 'Capherian rocks',
    greekName: 'Καφήρειαι πέτραι',
    kind: 'strait',
    geometry: {
      type: 'LineString',
      coordinates: [
        [24.14, 38.08],
        [24.17, 38.1],
        [24.2, 38.12],
        [24.22, 38.14],
      ],
    },
    region: 'euboea',
    importance: 'major',
    summary: [
      {
        text: 'The Capherian rocks — the Euboean reef below Mount Caphareus where Nauplius\' false beacon wrecked the Greek fleet on the homeward sea, and where Hyginus sets the storm that dashed the Locrian Ajax against the Rocks of Ajax.',
        sources: ['apollodorus', 'hyginus'],
        citation: 'Epitome 6.7; Fabulae 116',
      },
    ],
    sources: ['apollodorus', 'hyginus'],
  },
  {
    id: 'evenus',
    name: 'Evenus',
    greekName: 'Εὔηνος',
    kind: 'river',
    geometry: {
      type: 'LineString',
      coordinates: [
        [21.55, 38.85],
        [21.65, 38.75],
        [21.75, 38.58],
        [21.82, 38.48],
        [21.72, 38.37],
      ],
    },
    region: 'aetolia',
    importance: 'major',
    summary: [
      {
        text: 'Evenus — the Aetolian river where Heracles crossed with Deianira and Nessus the centaur tried to ravish her; the hero’s hydra-poisoned arrow killed the ferryman, whose dying blood became the shirt that consumed the son of Zeus on Mount Oeta.',
        sources: ['apollodorus', 'ovid'],
        citation: 'Bibliotheca 2.7.6; Metamorphoses 9.101-158',
      },
    ],
    sources: ['apollodorus', 'ovid'],
  },
  {
    id: 'ismenus',
    name: 'Ismenus',
    greekName: 'Ἰσμηνός',
    kind: 'river',
    geometry: {
      type: 'LineString',
      coordinates: [
        [23.05, 38.38],
        [23.08, 38.36],
        [23.1, 38.33],
        [23.12, 38.31],
      ],
    },
    region: 'boeotia',
    importance: 'major',
    summary: [
      {
        text: 'Ismenus — the Theban river beside which Apollo and Artemis descended on Niobe’s children, and where Amphiaraus fled before Zeus split the earth and made the seer immortal.',
        sources: ['apollodorus', 'ovid', 'apollonius'],
        citation: 'Bibliotheca 3.5.6, 3.6.8; Metamorphoses 6.146-312; Argonautica 1.519',
      },
    ],
    sources: ['apollodorus', 'ovid', 'apollonius'],
  },
  {
    id: 'cape-geraestus',
    name: 'Geraestus',
    greekName: 'Γεραιστός',
    kind: 'strait',
    geometry: {
      type: 'LineString',
      coordinates: [
        [24.02, 38.38],
        [24.05, 38.36],
        [24.08, 38.34],
      ],
    },
    region: 'euboea',
    importance: 'major',
    summary: [
      {
        text: 'Cape Geraestus — the southern headland of Euboea where Pelops cast Myrtilus into the sea and the charioteer cursed the house of Pelops as he drowned in the waters that took the name Myrtoan.',
        sources: ['homer', 'apollodorus', 'hyginus'],
        citation: 'Odyssey 3.145-180; Epitome 2.8; Fabulae 84',
      },
    ],
    sources: ['homer', 'apollodorus', 'hyginus'],
  },
  {
    id: 'myrtoan-sea',
    name: 'Myrtoan Sea',
    greekName: 'Μυρτῷον πέλαγος',
    kind: 'gulf',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [22.8, 38.45],
          [24.5, 38.45],
          [24.5, 37.2],
          [22.8, 37.2],
          [22.8, 38.45],
        ],
      ],
    },
    region: null,
    importance: 'major',
    summary: [
      {
        text: 'The Myrtoan Sea — the Aegean waters between Euboea and the Peloponnese into which Myrtilus was cast from Cape Geraestus, whose drowning curse ripened in the generation of Atreus and Thyestes.',
        sources: ['apollodorus', 'hyginus'],
        citation: 'Epitome 2.8; Fabulae 84',
      },
    ],
    sources: ['apollodorus', 'hyginus'],
  },
];

/** Default place name → feature id. Homonyms use STORY_OVERRIDES. */
const FEATURE_ALIASES = {
  olympus: 'mount-olympus',
  mountolympus: 'mount-olympus',
  parnassus: 'mount-parnassus',
  mountparnassus: 'mount-parnassus',
  pelion: 'mount-pelion',
  mountpelion: 'mount-pelion',
  cithaeron: 'mount-cithaeron',
  mountcithaeron: 'mount-cithaeron',
  oeta: 'mount-oeta',
  mountoeta: 'mount-oeta',
  etna: 'mount-etna',
  mountetna: 'mount-etna',
  tmolus: 'mount-tmolus',
  mounttmolus: 'mount-tmolus',
  cyllene: 'mount-cyllene',
  mountcyllene: 'mount-cyllene',
  sipylus: 'mount-sipylus',
  mountsipylus: 'mount-sipylus',
  nysa: 'mount-nysa',
  mountnysa: 'mount-nysa',
  dicte: 'mount-dicte',
  mountdicte: 'mount-dicte',
  erymanthus: 'mount-erymanthus',
  mounterymanthus: 'mount-erymanthus',
  hymettus: 'mount-hymettus',
  mounthymettus: 'mount-hymettus',
  caphareus: 'mount-caphareus',
  mountcaphareus: 'mount-caphareus',
  rhodope: 'mount-rhodope',
  mountrhodope: 'mount-rhodope',
  mountida: 'mount-ida-troas',
  atlas: 'mount-atlas',
  mountatlas: 'mount-atlas',
  atlasrealm: 'mount-atlas',
  caucasus: 'mount-caucasus',
  eridanus: 'eridanus',
  // Rivers
  achelous: 'achelous',
  eurotas: 'eurotas',
  thenile: 'nilus',
  nile: 'nilus',
  thestrymon: 'strymon',
  strymon: 'strymon',
  alpheus: 'alpheus',
  peneus: 'peneus',
  tempe: 'peneus',
  spercheius: 'spercheius',
  inachus: 'inachus',
  rivercephisus: 'cephissus-boeotia',
  cephisus: 'cephissus-boeotia',
  // Pieria → Olympus foothills
  pieria: 'mount-olympus',
  // Chthonic
  thehouseofhades: 'acheron',
  acheron: 'acheron',
  cocytus: 'cocytus',
  styx: 'styx-arcadia',
  // Straits & seas (Argonautica / Orpheus)
  hellespont: 'hellespont',
  hebrus: 'hebrus',
  symplegades: 'symplegades',
  thesymplegades: 'symplegades',
  clashingrocks: 'symplegades',
  theclashingrocks: 'symplegades',
  wanderingrocks: 'symplegades',
  thewanderingrocks: 'symplegades',
  propontis: 'propontis',
  scyllacharybdis: 'scylla-charybdis',
  straitofmessina: 'scylla-charybdis',
  straitsofmessina: 'scylla-charybdis',
  gyraeanrocks: 'gyraean-rocks',
  thegyraeanrocks: 'gyraean-rocks',
  capherianrocks: 'capherian-rocks',
  thecapherianrocks: 'capherian-rocks',
  cephareanrocks: 'capherian-rocks',
  thecephareanrocks: 'capherian-rocks',
  riverevenus: 'evenus',
  evenus: 'evenus',
  ismenus: 'ismenus',
  capegeraestus: 'cape-geraestus',
  myrtoansea: 'myrtoan-sea',
};

/** storyId + place name → feature id (homonym disambiguation). */
const STORY_OVERRIDES = {
  'glaucus-scylla:the strait': 'scylla-charybdis',
  'birth-of-zeus:Mount Ida': 'mount-ida-crete',
  'birth-of-zeus:Mount Dicte': 'mount-dicte',
  'daphne-laurel:Peneus': 'peneus',
  'daphne-laurel:Tempe': 'peneus',
  'io-wandering:The Nile': 'nilus',
  'io-wandering:Lerna': 'inachus',
  'alcmaeon-wanderings:Achelous': 'achelous',
};

function resolveFeatureId(storyId, placeName) {
  const key = `${storyId}:${placeName}`;
  if (Object.hasOwn(STORY_OVERRIDES, key)) return STORY_OVERRIDES[key];
  const n = norm(placeName);
  return FEATURE_ALIASES[n] ?? null;
}

const features = JSON.parse(fs.readFileSync(FEATURES_FILE, 'utf8'));
const featureById = new Map(features.map((f) => [f.id, f]));
let featuresAdded = 0;

for (const feature of [...NEW_FEATURES, ...NEW_HYDRO_FEATURES]) {
  if (featureById.has(feature.id)) continue;
  features.push(feature);
  featureById.set(feature.id, feature);
  featuresAdded++;
}

let wired = 0;
let skipped = 0;
const storyIdsToAdd = new Map();
const log = [];

for (const file of fs.readdirSync(STORIES_DIR).filter((f) => f.endsWith('.json'))) {
  const filePath = path.join(STORIES_DIR, file);
  const story = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let changed = false;

  for (const place of story.places ?? []) {
    if (place.id || place.featureId) continue;
    const featureId = resolveFeatureId(story.id, place.name);
    if (!featureId || !featureById.has(featureId)) {
      skipped++;
      continue;
    }
    place.featureId = featureId;
    wired++;
    changed = true;
    log.push(`${story.id}: "${place.name}" → ${featureId}`);
    if (!storyIdsToAdd.has(featureId)) storyIdsToAdd.set(featureId, new Set());
    storyIdsToAdd.get(featureId).add(story.id);
  }

  if (changed && !DRY) {
    fs.writeFileSync(filePath, `${JSON.stringify(story, null, 2)}\n`);
  }
}

let geoUpdated = 0;
for (const [featureId, storyIdSet] of storyIdsToAdd) {
  const feature = featureById.get(featureId);
  if (!feature) continue;
  const existing = new Set(feature.storyIds ?? []);
  let added = false;
  for (const sid of storyIdSet) {
    if (!existing.has(sid)) {
      existing.add(sid);
      added = true;
    }
  }
  if (added) {
    feature.storyIds = [...existing].sort();
    geoUpdated++;
  }
}

if (!DRY) {
  if (featuresAdded > 0 || geoUpdated > 0) {
    fs.writeFileSync(FEATURES_FILE, `${JSON.stringify(features, null, 2)}\n`);
  }
}

console.log(DRY ? 'DRY RUN' : 'APPLIED');
console.log(`new features: ${featuresAdded}`);
console.log(`wired: ${wired}`);
console.log(`skipped: ${skipped}`);
console.log(`features storyIds updated: ${geoUpdated}`);
if (log.length) {
  console.log('\nWirings:');
  log.forEach((l) => console.log(' ', l));
}

let remaining = 0;
for (const file of fs.readdirSync(STORIES_DIR).filter((f) => f.endsWith('.json'))) {
  const story = JSON.parse(fs.readFileSync(path.join(STORIES_DIR, file), 'utf8'));
  for (const p of story.places ?? []) {
    if (!p.id && !p.featureId) remaining++;
  }
}
console.log(`\nplain places remaining (no id, no featureId): ${remaining}`);
