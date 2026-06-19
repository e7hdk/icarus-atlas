/**
 * OSM Overpass fetch for river geometry caches.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { FetchPlan } from './river-geometry-recipes';

const OSM_DIR = join('data', 'geo', 'raw', 'osm');
const ENDPOINT = 'https://overpass-api.de/api/interpreter';
const SLEEP_MS = 12_000;
/** Overpass returns 406 without a identifying User-Agent (curl sends one by default). */
const USER_AGENT = 'icarus-atlas/1.0 (river-geometry; +https://github.com/lookfor-fatih/icarus-atlas)';

export interface FetchOptions {
  plans: FetchPlan[];
  force?: boolean;
  dryRun?: boolean;
}

export interface FetchResult {
  cacheFile: string;
  featureId: string;
  status: 'skipped' | 'fetched' | 'failed' | 'dry-run';
  wayCount?: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchOne(plan: FetchPlan, force: boolean): Promise<FetchResult> {
  const target = join(OSM_DIR, plan.cacheFile);

  if (!force && existsSync(target)) {
    const cached = readFileSync(target, 'utf-8');
    if (cached.startsWith('{')) {
      const count = (JSON.parse(cached).elements ?? []).filter(
        (e: { type: string }) => e.type === 'way',
      ).length;
      if (count > 0) {
        return { cacheFile: plan.cacheFile, featureId: plan.featureId, status: 'skipped', wayCount: count };
      }
    }
  }

  process.stdout.write(`  fetch ${plan.cacheFile} (${plan.source}, ${plan.featureId})… `);
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': USER_AGENT,
    },
    body: `data=${encodeURIComponent(plan.query)}`,
  });
  const text = await res.text();
  if (!res.ok || !text.startsWith('{')) {
    console.log(`FAILED (${res.status})`);
    return { cacheFile: plan.cacheFile, featureId: plan.featureId, status: 'failed' };
  }

  writeFileSync(target, text);
  const wayCount = (JSON.parse(text).elements ?? []).filter((e: { type: string }) => e.type === 'way').length;
  console.log(`${wayCount} ways`);
  return { cacheFile: plan.cacheFile, featureId: plan.featureId, status: 'fetched', wayCount };
}

export async function fetchOsmRivers(options: FetchOptions): Promise<FetchResult[]> {
  const { plans, force = false, dryRun = false } = options;
  mkdirSync(OSM_DIR, { recursive: true });

  if (dryRun) {
    for (const plan of plans) {
      console.log(`  [dry-run] ${plan.cacheFile} ← ${plan.featureId} (${plan.source})`);
    }
    return plans.map((p) => ({ cacheFile: p.cacheFile, featureId: p.featureId, status: 'dry-run' }));
  }

  const results: FetchResult[] = [];
  for (let i = 0; i < plans.length; i++) {
    results.push(await fetchOne(plans[i], force));
    if (i < plans.length - 1) await sleep(SLEEP_MS);
  }
  return results;
}

/** Legacy: fetch all manual queries (used by fetch-osm-rivers.ts wrapper). */
export async function fetchAllManualQueries(force = false): Promise<void> {
  const { MANUAL_OSM_QUERIES } = await import('./river-geometry-recipes');
  const plans: FetchPlan[] = Object.entries(MANUAL_OSM_QUERIES).map(([cacheFile, query]) => ({
    featureId: cacheFile.replace('.json', ''),
    cacheFile,
    query,
    source: 'manual' as const,
  }));
  await fetchOsmRivers({ plans, force });
}
