/**
 * @deprecated Use pnpm refresh:rivers (fetch + sync orchestrator).
 * Kept for backward compatibility — runs manual OSM queries only.
 */
import { fetchAllManualQueries } from './lib/river-geometry-fetch';

const force = process.argv.includes('--fetch');

fetchAllManualQueries(force)
  .then(() => console.log('done — run pnpm refresh:rivers or pnpm sync:river-geometry'))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
