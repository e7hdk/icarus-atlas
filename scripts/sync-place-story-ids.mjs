#!/usr/bin/env node
/**
 * Rebuild geo/places.json storyIds from story place references.
 * Places referenced by at least one story get storyIds = sorted unique story ids.
 * Places with no story references keep existing storyIds (manual backfill preserved).
 *
 * Run: node scripts/sync-place-story-ids.mjs [--dry-run]
 */
import fs from 'fs';
import path from 'path';

const DRY = process.argv.includes('--dry-run');
const DATA = path.join(process.cwd(), 'data');
const STORIES_DIR = path.join(DATA, 'stories');
const PLACES_FILE = path.join(DATA, 'geo/places.json');

const storyRefs = new Map(); // placeId -> Set<storyId>

for (const file of fs.readdirSync(STORIES_DIR).filter((f) => f.endsWith('.json'))) {
  const story = JSON.parse(fs.readFileSync(path.join(STORIES_DIR, file), 'utf8'));
  for (const place of story.places ?? []) {
    if (!place.id) continue;
    if (!storyRefs.has(place.id)) storyRefs.set(place.id, new Set());
    storyRefs.get(place.id).add(story.id);
  }
}

const places = JSON.parse(fs.readFileSync(PLACES_FILE, 'utf8'));
let updated = 0;
let added = 0;

for (const place of places) {
  const refs = storyRefs.get(place.id);
  if (!refs || refs.size === 0) continue;

  const next = [...refs].sort();
  const prev = place.storyIds ?? [];
  if (JSON.stringify(prev) === JSON.stringify(next)) continue;

  if (prev.length === 0) added++;
  updated++;
  place.storyIds = next;
}

if (!DRY && updated > 0) {
  fs.writeFileSync(PLACES_FILE, `${JSON.stringify(places, null, 2)}\n`);
}

console.log(DRY ? 'DRY RUN' : 'APPLIED');
console.log(`places updated: ${updated} (${added} newly gained storyIds)`);
