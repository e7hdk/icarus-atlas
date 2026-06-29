#!/usr/bin/env node
/**
 * Wire story places[].name to cities.json ids where mapping is corpus-safe.
 * Run: node scripts/wire-story-places.mjs [--dry-run]
 */
import fs from 'fs';
import path from 'path';

const DRY = process.argv.includes('--dry-run');
const DATA = path.join(process.cwd(), 'data');
const STORIES_DIR = path.join(DATA, 'stories');
const PLACES_FILE = path.join(DATA, 'geo/places.json');

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

const cities = JSON.parse(fs.readFileSync(path.join(DATA, 'geo/cities.json'), 'utf8'));
const cityById = new Map(cities.map((c) => [c.id, c]));
const cityByNormName = new Map(cities.map((c) => [norm(c.name), c.id]));

/**
 * Curated place name → cities.json id.
 * Only entries that are unambiguous in our geo layer (see WEST_MEDITERRANEAN_PLAN, COSMIC_CYCLE).
 */
const ALIASES = {
  // Regional → flagship city (established in existing stories)
  crete: 'knossos',
  gnossus: 'knossos',
  attica: 'athens',
  laconia: 'sparta',
  cyprus: 'salamis-cyprus',
  paphos: 'salamis-cyprus',
  colchis: 'aea-colchis',
  aea: 'aea-colchis',
  sicily: 'syracuse',
  campania: 'campania',
  thessaly: 'larisa',
  thessalian: 'larisa',
  phthia: 'larisa',
  phthiotis: 'larisa',
  lycia: 'xanthus-lycia',
  xanthus: 'xanthus-lycia',
  lydia: 'sardis',
  caria: 'halicarnassus',
  euboea: 'chalcis',
  boeotia: 'thebes',
  arcadia: 'mantinea',
  messenia: 'andania',
  argolis: 'argos',
  achaea: 'corinth',
  peloponnese: 'sparta',
  phaeacia: 'corcyra',
  scheria: 'corcyra',
  oichalia: 'ephesus',
  // nemea → sanctuary id (not Argos)
  // Italy strand — Lavinium as Aeneas' landing (WEST_MEDITERRANEAN_PLAN §7)
  italy: 'lavinium',
  latium: 'lavinium',
  magnagraecia: 'tarentum',
  // Islands / cities by common attested name
  cos: 'kos',
  miletos: 'miletus',
  gortys: 'gortyn',
  corfu: 'corcyra',
  ilium: 'troy',
  ilion: 'troy',
  lacedaemon: 'sparta',
  salamisofcyprus: 'salamis-cyprus',
  aeaincolchis: 'aea-colchis',
  aulis: 'aulis-boeotia',
  pagasae: 'pagasae',
  larissa: 'larisa',
  tenedos: 'tenedos',
  troezen: 'troezen',
  antandros: 'antandros',
  colophon: 'colophon',
  notium: 'notium',
  notion: 'notium',
  tegea: 'tegea',
  phrygia: 'gordion',
  ambracia: 'ambracia',
  marathon: 'marathon',
  hypaepa: 'hypaepa',
  amathus: 'amathus-cyprus',
  amyclae: 'amyclae',
  leuctra: 'leuctra-laconia',
  anthedon: 'anthedon',
  phaestus: 'phaistos',
  phaistos: 'phaistos',
  glisas: 'glisas',
  aphidnae: 'aphidnae',
  thespiae: 'thespiae',
  panopeus: 'panopeus',
  pisa: 'pisa-elis',
  strophades: 'strophades',
  thestrophades: 'strophades',
  plataea: 'plataea',
  daulis: 'daulis',
  trachis: 'trachis-malis',
  trachisnearthermopylae: 'trachis-malis',
  meliboea: 'meliboea-magnesia',
  methone: 'methone-magnesia',
  olizon: 'olizon-magnesia',
  thaumacia: 'thaumacia-magnesia',
  thermopylae: 'thermopylae-malis',
  halus: 'halus-achaea-phthiotis',
  phylace: 'phylace-phthiotis',
  tamasus: 'tamassos',
  tamassos: 'tamassos',
  opous: 'opous-locris',
  opus: 'opous-locris',
  locriancoast: 'opous-locris',
  opuntianlocris: 'opous-locris',
  salmydessus: 'salmydessus',
  // Regional → flagship city (geo backfill batch)
  elis: 'pisa-elis',
  haemonia: 'larisa',
  mysia: 'pergamon',
  thracianshore: 'sigeum',
  aetolia: 'calydon',
  epirus: 'ambracia',
  laurentum: 'lavinium',
  carthaea: 'ceos',
  icariansea: 'icaria',
};

const places = JSON.parse(fs.readFileSync(PLACES_FILE, 'utf8'));
const geoById = new Map(places.map((p) => [p.id, p]));
const geoByNormName = new Map(places.map((p) => [norm(p.name), p.id]));
const placeByCityId = new Map(
  places.filter((p) => p.kind === 'city').map((p) => [p.cityId ?? p.id, p]),
);

/** Names that must stay plain (features, regions without geo nodes, cosmic sites).
 *  Keep in sync with STORY_FORCE_PLAIN in scripts/validate-data.ts */
const FORCE_PLAIN = new Set([
  // Cosmic / chthonic — no map pin
  norm('Olympus'),
  norm('Mount Olympus'),
  norm('Parnassus'),
  norm('Mount Parnassus'),
  norm('Tartarus'),
  norm('Hades'),
  norm('Underworld'),
  norm('Ocean'),
  norm('Oceanus'),
  norm('Elysium'),
  norm('Elysian Fields'),
  norm('Asphodel Meadows'),
  norm('Styx'),
  norm('Islands of the Blest'),
  norm('The palace of the Sun'),
  norm('The Gorgons\' lair'),
  // Far-myth lands — no Med pin
  norm('Ethiopia'),
  norm('Rome'),
  norm('Phoenicia'),
  norm('Libya'),
  norm('Babylon'),
  norm('Panchaea'),
  norm('India'),
  norm('Arabia'),
  norm('Scythia'),
  norm('Thrace'),
  norm('Thracian'),
  norm('Caucasus'),
  norm('Carthage'),
  // Regions / plains without geo nodes
  norm('Maeonia'),
  norm('Paphlagonia'),
  norm('Ciconia'),
  norm('Cicones'),
  norm('Aleian plain'),
  norm('Phlegra'),
  norm('Nysa'),
  // Mountains, rivers, straits — use features.json
  norm('Mount Ida'),
  norm('Mount Pelion'),
  norm('Mount Cithaeron'),
  norm('Mount Oeta'),
  norm('Mount Tmolus'),
  norm('Mount Cyllene'),
  norm('Mount Sipylus'),
  norm('Mount Nysa'),
  norm('Mount Etna'),
  norm('Mount Dicte'),
  norm('Mount Erymanthus'),
  norm('Lake Tritonis'),
  norm('Lake Pergus'),
  norm('River Acis'),
  norm('River Alpheus'),
  norm('River Simois'),
  norm('River Scamander'),
  norm('River Spercheius'),
  norm('River Eurotas'),
  norm('River Asopus'),
  norm('River Cephissus'),
  norm('River Ilissus'),
  norm('River Peneus'),
  norm('River Strymon'),
  norm('Scamander'),
  norm('Simois'),
  norm('Spercheius'),
  norm('Straits of Messina'),
  norm('Messina'),
  norm('Malea'),
  norm('Cape Malea'),
  // Odyssey / nostoi sites without fixed geography
  norm('Aeolus\' isle'),
  norm('The White Isle'),
  norm('White Island'),
  norm('Ismarus'),
  norm('Zacynthus'),
  // Other plain attested names
  norm('Olenus'),
  norm("Ninus' tomb"),
  norm('Enna'),
  norm('Henna'),
  norm("Hephaestus' forge"),
  norm('Forge of Hephaestus'),
  norm('Lemnos forge'),
]);

/** Non-city geo place ids (sanctuary, myth-site, landmark). */
const GEO_ALIASES = {
  delphi: 'delphi',
  pytho: 'delphi',
  eleusis: 'eleusis',
  dodona: 'dodona',
  olympia: 'olympia',
  aeaea: 'aeaea',
  ogygia: 'ogygia',
  memphis: 'memphis',
  egypt: 'memphis',
  sunium: 'sounion',
  nemea: 'nemea',
  claros: 'claros',
  wellofglauce: 'well-of-glauce',
  altarofheraoftheheight: 'hera-of-the-height',
  heraoftheheight: 'hera-of-the-height',
  oracleofthedead: 'nekuomanteion',
  thrinacia: 'thrinacia',
  leucas: 'leucas',
  isthmia: 'isthmia',
  brauron: 'brauron',
  sounion: 'sounion',
  didyma: 'didyma',
  rhamnus: 'rhamnus',
  phocis: 'delphi',
  colonus: 'colonus-athens',
  taenarus: 'taenarus',
  taenarum: 'taenarus',
  gargaphie: 'gargaphie',
  sardinia: 'sardinia',
  illyria: 'illyria',
  anthemoessa: 'anthemoessa',
  pharos: 'pharos',
  tauris: 'tauris',
  oechalia: 'oechalia',
  laestrygonia: 'laestrygonia',
  landofthelotuseaters: 'lotus-eaters',
  cyclopsisle: 'cyclopes-isle',
};

/** storyId + place name → geo/city id (homonym disambiguation). */
const STORY_OVERRIDES = {
  'orion-the-hunter:Ortygia': 'delos',
};

function resolvePlaceId(storyId, placeName) {
  const overrideKey = `${storyId}:${placeName}`;
  if (Object.hasOwn(STORY_OVERRIDES, overrideKey)) {
    const id = STORY_OVERRIDES[overrideKey];
    if (cityById.has(id) || geoById.has(id)) return id;
  }
  const n = norm(placeName);
  if (FORCE_PLAIN.has(n)) return null;
  const cityId = ALIASES[n] ?? cityByNormName.get(n) ?? null;
  if (cityId && cityById.has(cityId)) return cityId;
  const geoId = GEO_ALIASES[n] ?? geoByNormName.get(n) ?? null;
  if (geoId && geoById.has(geoId)) return geoId;
  return null;
}

let wired = 0;
let skipped = 0;
const storyIdsToAdd = new Map(); // cityId -> Set<storyId>
const log = [];

for (const file of fs.readdirSync(STORIES_DIR).filter((f) => f.endsWith('.json'))) {
  const filePath = path.join(STORIES_DIR, file);
  const story = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let changed = false;

  for (const place of story.places ?? []) {
    if (place.id) continue;
    const placeId = resolvePlaceId(story.id, place.name);
    if (!placeId) {
      skipped++;
      continue;
    }
    place.id = placeId;
    wired++;
    changed = true;
    log.push(`${story.id}: "${place.name}" → ${placeId}`);
    if (!storyIdsToAdd.has(placeId)) storyIdsToAdd.set(placeId, new Set());
    storyIdsToAdd.get(placeId).add(story.id);
  }

  if (changed && !DRY) {
    fs.writeFileSync(filePath, `${JSON.stringify(story, null, 2)}\n`);
  }
}

// Backfill storyIds on geo places
let geoUpdated = 0;
for (const [placeId, storyIdSet] of storyIdsToAdd) {
  const geo = geoById.get(placeId) ?? placeByCityId.get(placeId);
  if (!geo) continue;
  const existing = new Set(geo.storyIds ?? []);
  let added = false;
  for (const sid of storyIdSet) {
    if (!existing.has(sid)) {
      existing.add(sid);
      added = true;
    }
  }
  if (added) {
    geo.storyIds = [...existing].sort();
    geoUpdated++;
  }
}

if (!DRY && geoUpdated > 0) {
  fs.writeFileSync(PLACES_FILE, `${JSON.stringify(places, null, 2)}\n`);
}

console.log(DRY ? 'DRY RUN' : 'APPLIED');
console.log(`wired: ${wired}`);
console.log(`skipped (stay plain): ${skipped}`);
console.log(`geo places updated: ${geoUpdated}`);
if (log.length) {
  console.log('\nWirings:');
  log.forEach((l) => console.log(' ', l));
}

// Count remaining plain
let remaining = 0;
for (const file of fs.readdirSync(STORIES_DIR).filter((f) => f.endsWith('.json'))) {
  const story = JSON.parse(fs.readFileSync(path.join(STORIES_DIR, file), 'utf8'));
  for (const p of story.places ?? []) if (!p.id && !p.featureId) remaining++;
}
console.log(`\nplain places remaining (no id, no featureId): ${remaining}`);
