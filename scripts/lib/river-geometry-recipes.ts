/**
 * River geometry recipes — anchors, OSM fetch plans, and auto-discovery rules.
 * Used by refresh-river-geometry.ts (orchestrator), fetch, and sync.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export type LonLat = [number, number];

export interface RiverAnchor {
  point: LonLat;
  maxDistKm: number;
  mouth?: LonLat;
  mouthMaxDistKm?: number;
}

export interface LinearGeoFeature {
  id: string;
  name: string;
  greekName: string;
  kind: string;
  geometry: { type: 'LineString'; coordinates: LonLat[] };
  placeIds?: string[];
}

export interface GeoPlaceRow {
  id: string;
  coordinates: LonLat;
}

/** Mythic anchor — stitched geometry must pass within maxDistKm of this point. */
export const RIVER_ANCHORS: Record<string, RiverAnchor> = {
  eurotas: { point: [22.4247, 37.0818], maxDistKm: 5 },
  alpheus: { point: [21.63, 37.64], maxDistKm: 8 },
  peneus: {
    point: [22.683, 39.833],
    maxDistKm: 12,
    mouth: [22.7175, 39.934],
    mouthMaxDistKm: 6,
  },
  achelous: {
    point: [21.35, 38.75],
    maxDistKm: 12,
    mouth: [21.105, 38.338],
    mouthMaxDistKm: 4,
  },
  scamander: { point: [26.2385, 39.9574], maxDistKm: 4 },
  simoeis: { point: [26.28, 39.805], maxDistKm: 6 },
  hellespont: {
    point: [26.395, 40.215],
    maxDistKm: 8,
    mouth: [26.066, 39.997],
    mouthMaxDistKm: 3,
  },
  'scylla-charybdis': {
    point: [15.46, 38.12],
    maxDistKm: 6,
    mouth: [15.65, 38.02],
    mouthMaxDistKm: 3,
  },
  maeander: {
    point: [27.35, 37.55],
    maxDistKm: 40,
    mouth: [27.182, 37.549],
    mouthMaxDistKm: 4,
  },
  nilus: {
    point: [31.2, 30.0],
    maxDistKm: 80,
    mouth: [31.237, 30.124],
    mouthMaxDistKm: 6,
  },
  inachus: {
    point: [22.7204, 37.631],
    maxDistKm: 10,
    mouth: [22.785, 37.525],
    mouthMaxDistKm: 6,
  },
  'asopus-boeotia': {
    point: [23.3177, 38.3199],
    maxDistKm: 15,
    mouth: [23.702, 38.325],
    mouthMaxDistKm: 4,
  },
  'cephissus-attica': {
    point: [23.7239, 37.9716],
    maxDistKm: 8,
    mouth: [23.61, 37.935],
    mouthMaxDistKm: 5,
  },
  spercheius: {
    point: [22.544, 38.797],
    maxDistKm: 12,
    mouth: [22.62, 38.85],
    mouthMaxDistKm: 8,
  },
  hermus: {
    point: [28.04, 38.49],
    maxDistKm: 35,
    mouth: [26.82, 38.595],
    mouthMaxDistKm: 4,
  },
  cayster: {
    point: [27.34, 37.94],
    maxDistKm: 15,
    mouth: [27.263, 37.958],
    mouthMaxDistKm: 4,
  },
  'cephissus-boeotia': {
    point: [22.95, 38.45],
    maxDistKm: 12,
    mouth: [23.08, 38.42],
    mouthMaxDistKm: 8,
  },
  pleistos: {
    point: [22.493, 38.482],
    maxDistKm: 8,
    mouth: [22.38, 38.32],
    mouthMaxDistKm: 6,
  },
  strymon: {
    point: [23.85, 41.08],
    maxDistKm: 20,
    mouth: [23.88, 40.78],
    mouthMaxDistKm: 12,
  },
  halys: {
    point: [34.0, 40.5],
    maxDistKm: 40,
    mouth: [35.149, 41.324],
    mouthMaxDistKm: 4,
  },
  enipeus: {
    point: [22.2, 39.7],
    maxDistKm: 18,
    mouth: [22.0889, 39.5725],
    mouthMaxDistKm: 6,
  },
  'axios-macedon': {
    point: [22.5, 40.8],
    maxDistKm: 25,
    mouth: [22.717, 40.521],
    mouthMaxDistKm: 4,
  },
  sangarius: {
    point: [32.0, 39.95],
    maxDistKm: 30,
    mouth: [30.647, 41.069],
    mouthMaxDistKm: 4,
  },
  'ladon-arcadia': {
    point: [22.48, 37.88],
    maxDistKm: 12,
    mouth: [22.05, 37.85],
    mouthMaxDistKm: 8,
  },
  'asopus-phlias': {
    point: [22.55, 37.95],
    maxDistKm: 12,
    mouth: [22.779, 37.937],
    mouthMaxDistKm: 4,
  },
  orontes: {
    point: [36.2, 36.15],
    maxDistKm: 40,
    mouth: [35.97, 36.053],
    mouthMaxDistKm: 4,
  },
  ister: {
    point: [22.67, 44.72],
    maxDistKm: 35,
    mouth: [22.605, 44.295],
    mouthMaxDistKm: 4,
  },
  'styx-arcadia': {
    point: [22.316, 37.824],
    maxDistKm: 4,
  },
  euphrates: {
    point: [44.0, 32.5],
    maxDistKm: 40,
    mouth: [44.026, 31.036],
    mouthMaxDistKm: 4,
  },
  tigris: {
    point: [44.36, 33.31],
    maxDistKm: 40,
    mouth: [44.021, 30.899],
    mouthMaxDistKm: 4,
  },
  jordan: {
    point: [35.55, 32.88],
    maxDistKm: 8,
    mouth: [35.551, 31.593],
    mouthMaxDistKm: 4,
  },
  araxes: {
    point: [43.5, 40.8],
    maxDistKm: 25,
    mouth: [43.289, 40.154],
    mouthMaxDistKm: 4,
  },
  eridanus: {
    point: [11.9, 45.2],
    maxDistKm: 15,
    mouth: [12.281, 45.086],
    mouthMaxDistKm: 4,
  },
  acheron: {
    point: [20.531, 39.243],
    maxDistKm: 8,
    mouth: [20.83, 39.28],
    mouthMaxDistKm: 4,
  },
  cocytus: {
    point: [20.52, 39.25],
    maxDistKm: 6,
    mouth: [20.535, 39.245],
    mouthMaxDistKm: 3,
  },
};

/** Hand-tuned Overpass queries — exceptions OSM auto-discovery cannot handle. */
export const MANUAL_OSM_QUERIES: Record<string, string> = {
  'eurotas2.json': `[out:json][timeout:25];way["waterway"="river"]["name"="Ευρώτας"];out geom tags;`,
  'alpheus.json': `[out:json][timeout:25];way["waterway"="river"]["name"="Αλφειός"];out geom tags;`,
  'peneus-thessaly.json': `[out:json][timeout:25];way["waterway"="river"]["name"="Πηνειός"](39.2,22.0,40.2,23.5);out geom tags;`,
  'peneus2.json': `[out:json][timeout:25];way["waterway"="river"]["name"="Πηνειός"];out geom tags;`,
  'achelous3.json': `[out:json][timeout:25];way["waterway"="river"]["name"="Αχελώος"];out geom tags;`,
  'troy-rivers.json': `[out:json][timeout:25];(way["waterway"~"river|stream"](39.55,26.0,40.05,26.65););out geom tags;`,
  'orontes.json': `[out:json][timeout:90];(way["waterway"~"river|canal"]["name"~"Orontes|Ορόντης|Asi|Assi|العاصي",i](33.7,35.4,36.6,37.3););out geom tags;`,
  'hermus.json': `[out:json][timeout:90];(way["waterway"~"river|canal"]["name"~"Gediz|Hermus|Έρμος|Ἕρμος",i](38.5,26.5,39.5,29.0););out geom tags;`,
  'acheron.json': `[out:json][timeout:60];(way["waterway"~"river|stream|canal"]["name"~"Acheron|Acheronas|Αχέρων",i](38.5,19.8,39.6,21.0););out geom tags;`,
  'maeander.json': `[out:json][timeout:90];(way["waterway"~"river|canal"]["name"~"Büyük Menderes|Buyuk Menderes|Maeander|Μαίανδρος",i](36.8,26.0,38.3,29.5););out geom tags;`,
  'sangarius.json': `[out:json][timeout:90];(way["waterway"~"river|canal"]["name"~"Sakarya|Sangarius|Σαγγάριος",i](39.2,30.0,41.6,32.8););out geom tags;`,
  'nilus-delta.json': `[out:json][timeout:60];(way["waterway"~"river|canal"]["name"~"النيل|نهر النيل|Nile",i](29.5,30.0,32.5,31.5););out geom tags;`,
  'nilus-upstream.json': `[out:json][timeout:90];(way["waterway"~"river|canal"]["name"~"النيل|نهر النيل|Nile|Nile River",i](24.0,29.0,33.0,32.0););out geom tags;`,
  'jordan.json': `[out:json][timeout:90];(way["waterway"~"river|stream"]["name"~"נהר הירדן|نهر الأردن|Jordan River|River Jordan",i](31.3,35.0,33.5,36.0););out geom tags;`,
  'euphrates-turkey.json': `[out:json][timeout:60];(way["waterway"~"river|canal"]["name"~"Euphrates|Firat|Fırat|الفرات",i](36.0,36.5,38.5,42.0););out geom tags;`,
  'euphrates-iraq.json': `[out:json][timeout:90];(way["waterway"~"river|canal"]["name"~"Euphrates|الفرات",i](30.5,40.0,35.5,47.0););out geom tags;`,
  'tigris-lower.json': `[out:json][timeout:60];(way["waterway"="river"]["name"~"Dicle|Tigris|دجلة",i](31.0,43.0,38.0,45.5););out geom tags;`,
  'tigris-turkey.json': `[out:json][timeout:45];(way["waterway"~"river|canal"]["name"~"Dicle|Tigris|دجلة",i](37.5,38.0,39.5,42.5););out geom tags;`,
  'eridanus.json': `[out:json][timeout:90];(way["waterway"~"river|canal"]["name"~"Po|Po River|Fiume Po|Padus",i](44.5,8.0,46.8,12.8););out geom tags;`,
};

/** Maps feature id → OSM cache file(s) used by sync builders. */
export const FEATURE_OSM_CACHE: Record<string, string | string[]> = {
  eurotas: 'eurotas2.json',
  alpheus: 'alpheus.json',
  peneus: ['peneus-thessaly.json', 'peneus2.json'],
  achelous: 'achelous3.json',
  scamander: 'troy-rivers.json',
  simoeis: 'troy-rivers.json',
  orontes: 'orontes.json',
  hermus: 'hermus.json',
  acheron: 'acheron.json',
  maeander: 'maeander.json',
  sangarius: 'sangarius.json',
  tigris: ['tigris-lower.json', 'tigris-turkey.json'],
  nilus: ['nilus-upstream.json', 'nilus-delta.json'],
  jordan: 'jordan.json',
  euphrates: ['euphrates-turkey.json', 'euphrates-iraq.json'],
  eridanus: 'eridanus.json',
};

/** Extra OSM name tags to try when auto-fetching (beyond greekName). */
export const OSM_NAME_ALIASES: Record<string, string[]> = {
  inachus: ['Ίναχος', 'Ινάχος', 'Inachos', 'Inachus'],
  'asopus-boeotia': ['Ασωπός', 'Asopos', 'Asopus'],
  'cephissus-attica': ['Κηφισός', 'Kifisos', 'Cephissus'],
  eurotas: ['Ευρώτας'],
  alpheus: ['Αλφειός'],
  peneus: ['Πηνειός'],
  achelous: ['Αχελώος'],
  spercheius: ['Σπερχειός', 'Spercheios', 'Spercheius'],
  hermus: ['Έρμος', 'Hermus', 'Gediz', 'Gediz Nehri', 'Gediz Çayı'],
  maeander: ['Μαίανδρος', 'Maeander', 'Büyük Menderes', 'Buyuk Menderes', 'Büyük Menderes Nehri'],
  cayster: ['Κάυστρος', 'Cayster', 'Küçük Menderes'],
  'cephissus-boeotia': ['Κηφισός', 'Kifissos', 'Cephissus'],
  pleistos: ['Πλειστός', 'Pleistos', 'Pleistus'],
  strymon: ['Στρυμόνας', 'Στρυμών', 'Strymon', 'Struma', 'Струма'],
  halys: ['Άλυς', 'Halys', 'Kızılırmak', 'Kizilirmak'],
  enipeus: ['Ενιπέας', 'Ενιπεύς', 'Enipeus', 'Enipefs'],
  'axios-macedon': ['Αξιός', 'Axios', 'Vardar'],
  sangarius: ['Σαγγάριος', 'Sangarius', 'Sakarya', 'Sakarya Nehri'],
  'ladon-arcadia': ['Λάδων', 'Ladon', 'Ladonas', 'Λάδωνας'],
  'asopus-phlias': ['Ασωπός', 'Asopos', 'Asopus'],
  orontes: ['Ορόντης', 'Orontes', 'Asi', 'Assi', 'Nahr el-Asi', 'العاصي'],
  ister: ['Ἴστρος', 'Ister', 'Danube', 'Dunărea', 'Dunav', 'Дунав', 'Дунав/Dunav'],
  'styx-arcadia': ['Μαυρονέρι', 'Mavroneri', 'Mavronéri', 'Στύξ', 'Styx', 'Stiks'],
  euphrates: ['Ευφράτης', 'Euphrates', 'Firat', 'Fırat'],
  tigris: ['Τίγρις', 'Tigris', 'Dicle', 'Dicle Nehri'],
  jordan: ['Ιορδάνης', 'Jordan', 'Jordan River', 'נחל הירדן'],
  nilus: ['Νείλος', 'Nile', 'Nile River', 'النيل', 'نهر النيل'],
  araxes: ['Ἀράξης', 'Araxes', 'Aras'],
  eridanus: ['Ηριδανός', 'Eridanus', 'Po', 'Padus', 'Po River', 'Fiume Po'],
  acheron: ['Αχέρων', 'Acheron', 'Acheronas'],
  cocytus: ['Κωκυτός', 'Κώκυτος', 'Kokytos', 'Cocytus'],
};

/** Feature ids with a sync builder in sync-river-geometry.ts (includes NE-only). */
export const RIVER_SYNC_IDS = new Set([
  'scamander',
  'simoeis',
  'hellespont',
  'scylla-charybdis',
  'eurotas',
  'alpheus',
  'peneus',
  'achelous',
  'maeander',
  'nilus',
  'inachus',
  'asopus-boeotia',
  'cephissus-attica',
  'spercheius',
  'hermus',
  'cayster',
  'cephissus-boeotia',
  'pleistos',
  'strymon',
  'halys',
  'enipeus',
  'axios-macedon',
  'sangarius',
  'ladon-arcadia',
  'asopus-phlias',
  'orontes',
  'ister',
  'styx-arcadia',
  'euphrates',
  'tigris',
  'jordan',
  'araxes',
  'eridanus',
  'acheron',
  'cocytus',
]);

/** Features with bespoke sync builders — no generic OSM auto-fetch. */
export const SYNC_ONLY_IDS = new Set([
  'hellespont',
  'scylla-charybdis',
  'peneus',
  'achelous',
  'scamander',
  'simoeis',
]);

const PLACES_FILE = join('data', 'geo', 'places.json');

export function loadPlaces(): GeoPlaceRow[] {
  return JSON.parse(readFileSync(PLACES_FILE, 'utf-8')) as GeoPlaceRow[];
}

export function loadLinearFeatures(): LinearGeoFeature[] {
  const raw = JSON.parse(readFileSync(join('data', 'geo', 'features.json'), 'utf-8')) as LinearGeoFeature[];
  return raw.filter(
    (f) =>
      f.geometry?.type === 'LineString' &&
      (f.kind === 'river' || f.kind === 'strait') &&
      Array.isArray(f.geometry.coordinates) &&
      f.geometry.coordinates.length >= 2,
  );
}

export function resolveAnchor(feature: LinearGeoFeature, places: GeoPlaceRow[]): RiverAnchor | null {
  const explicit = RIVER_ANCHORS[feature.id];
  if (explicit) return explicit;

  const placeId = feature.placeIds?.[0];
  if (!placeId) return null;
  const place = places.find((p) => p.id === placeId);
  if (!place) return null;

  return { point: place.coordinates, maxDistKm: 15 };
}

/** Overpass bbox: south,west,north,east */
export function anchorSearchBbox(anchor: RiverAnchor, padDeg = 1.1): string {
  const [lon, lat] = anchor.point;
  const s = (lat - padDeg).toFixed(4);
  const w = (lon - padDeg).toFixed(4);
  const n = (lat + padDeg).toFixed(4);
  const e = (lon + padDeg).toFixed(4);
  return `${s},${w},${n},${e}`;
}

export function osmNamesForFeature(feature: LinearGeoFeature): string[] {
  const aliases = OSM_NAME_ALIASES[feature.id] ?? [];
  const fromGreek = feature.greekName ? [feature.greekName] : [];
  const fromName = feature.name ? [feature.name] : [];
  return [...new Set([...aliases, ...fromGreek, ...fromName])];
}

export function buildAutoOverpassQuery(feature: LinearGeoFeature, anchor: RiverAnchor): string {
  const names = osmNamesForFeature(feature);
  const escaped = names.map((n) => n.replace(/"/g, '\\"'));
  const nameFilter =
    escaped.length === 1
      ? `["name"="${escaped[0]}"]`
      : `["name"~"${escaped.join('|')}"]`;
  const bbox = anchorSearchBbox(anchor);
  return `[out:json][timeout:30];(way["waterway"~"river|stream"]${nameFilter}(${bbox}););out geom tags;`;
}

export interface FetchPlan {
  featureId: string;
  cacheFile: string;
  query: string;
  source: 'manual' | 'auto';
}

/** All OSM fetch jobs needed for the given feature ids. */
export function buildFetchPlans(
  features: LinearGeoFeature[],
  places: GeoPlaceRow[],
): FetchPlan[] {
  const plans: FetchPlan[] = [];
  const seenFiles = new Set<string>();

  for (const feature of features) {
    if (SYNC_ONLY_IDS.has(feature.id)) {
      const manualFiles = FEATURE_OSM_CACHE[feature.id];
      if (!manualFiles) continue;
      for (const file of Array.isArray(manualFiles) ? manualFiles : [manualFiles]) {
        const query = MANUAL_OSM_QUERIES[file];
        if (!query || seenFiles.has(file)) continue;
        seenFiles.add(file);
        plans.push({ featureId: feature.id, cacheFile: file, query, source: 'manual' });
      }
      continue;
    }

    const manualFiles = FEATURE_OSM_CACHE[feature.id];
    if (manualFiles) {
      for (const file of Array.isArray(manualFiles) ? manualFiles : [manualFiles]) {
        const query = MANUAL_OSM_QUERIES[file];
        if (!query || seenFiles.has(file)) continue;
        seenFiles.add(file);
        plans.push({ featureId: feature.id, cacheFile: file, query, source: 'manual' });
      }
      continue;
    }

    const anchor = resolveAnchor(feature, places);
    if (!anchor) continue;

    const cacheFile = `${feature.id}.json`;
    if (seenFiles.has(cacheFile)) continue;
    seenFiles.add(cacheFile);
    plans.push({
      featureId: feature.id,
      cacheFile,
      query: buildAutoOverpassQuery(feature, anchor),
      source: 'auto',
    });
  }

  return plans;
}

export function filterFeaturesById(features: LinearGeoFeature[], ids?: string[]): LinearGeoFeature[] {
  if (!ids?.length) return features;
  const want = new Set(ids);
  return features.filter((f) => want.has(f.id));
}
