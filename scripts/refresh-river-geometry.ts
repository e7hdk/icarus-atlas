#!/usr/bin/env tsx
/**
 * Refresh river/strait LineStrings in data/geo/features.json.
 *
 * Scans features.json for linear hydro features, fetches missing OSM caches,
 * stitches + decimates geometry, and writes coordinates back.
 *
 *   pnpm refresh:rivers              # fetch (if needed) + sync all
 *   pnpm refresh:rivers --id inachus # one feature
 *   pnpm refresh:rivers --fetch      # force OSM refetch
 *   pnpm refresh:rivers --sync-only  # skip fetch (old sync:river-geometry)
 *   pnpm refresh:rivers --dry-run    # show plan, no network / no write
 */
import {
  buildFetchPlans,
  filterFeaturesById,
  loadLinearFeatures,
  loadPlaces,
  RIVER_ANCHORS,
} from './lib/river-geometry-recipes';
import { fetchOsmRivers } from './lib/river-geometry-fetch';
import { runRiverGeometrySync } from './sync-river-geometry';

function parseArgs(argv: string[]) {
  const ids: string[] = [];
  let force = false;
  let dryRun = false;
  let syncOnly = false;
  let fetchOnly = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--fetch') force = true;
    else if (arg === '--dry-run') dryRun = true;
    else if (arg === '--sync-only') syncOnly = true;
    else if (arg === '--fetch-only') fetchOnly = true;
    else if (arg === '--id' || arg === '--ids') {
      const next = argv[++i];
      if (next) ids.push(...next.split(',').map((s) => s.trim()).filter(Boolean));
    } else if (!arg.startsWith('-')) {
      ids.push(arg);
    }
  }

  return { ids: ids.length ? ids : undefined, force, dryRun, syncOnly, fetchOnly };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const allFeatures = loadLinearFeatures();
  const features = filterFeaturesById(allFeatures, opts.ids);
  const places = loadPlaces();

  if (features.length === 0) {
    console.error('No matching river/strait features.');
    process.exit(1);
  }

  console.log(`Rivers tool — ${features.length} feature(s)`);
  for (const f of features) {
    const anchor = RIVER_ANCHORS[f.id] ?? (f.placeIds?.[0] ? 'place anchor' : 'no anchor');
    console.log(`  · ${f.id} (${f.kind})${typeof anchor === 'string' ? ` — ${anchor}` : ''}`);
  }

  const withRecipe = features.filter((f) => RIVER_ANCHORS[f.id] || f.placeIds?.length);
  const withoutRecipe = features.filter((f) => !RIVER_ANCHORS[f.id] && !f.placeIds?.length);
  if (withoutRecipe.length) {
    console.log('\nSkipped (no anchor recipe):');
    for (const f of withoutRecipe) console.log(`  · ${f.id}`);
  }

  if (!opts.syncOnly) {
    const plans = buildFetchPlans(withRecipe.length ? withRecipe : features, places);
    console.log(`\nOSM fetch — ${plans.length} cache file(s)`);
    const fetchResults = await fetchOsmRivers({ plans, force: opts.force, dryRun: opts.dryRun });
    const fetched = fetchResults.filter((r) => r.status === 'fetched').length;
    const skipped = fetchResults.filter((r) => r.status === 'skipped').length;
    const failed = fetchResults.filter((r) => r.status === 'failed').length;
    if (!opts.dryRun) console.log(`  → fetched ${fetched}, cached ${skipped}, failed ${failed}`);
  }

  if (!opts.fetchOnly) {
    console.log('\nGeometry sync');
    const report = runRiverGeometrySync({
      ids: opts.ids,
      dryRun: opts.dryRun,
    });
    for (const line of report.lines) console.log(`  ${line}`);
    if (!opts.dryRun) {
      console.log(`\n${report.updated ? `Updated ${report.count} geometries in data/geo/features.json` : 'No changes written'}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
