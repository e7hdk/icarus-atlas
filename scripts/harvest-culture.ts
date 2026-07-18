/** M8 discovery pipeline, stage 1 (docs/CULTURE_PLAN.md §9): harvest
 *  modern-reception candidates for a figure from Wikidata.
 *
 *  Usage: pnpm harvest:culture <character-id> [more-ids…]
 *
 *  Discovery only — output goes to research/culture-candidates/<id>.json
 *  (gitignored research evidence, like corpus hits), never into data/.
 *  Every candidate must carry an English Wikipedia sitelink (the one-click
 *  verification bar) and arrives ranked by sitelink count. QID pins are
 *  cached in data/wikidata-map.json; ambiguous name matches are refused.
 *
 *  Narrative linking is multi-hop on purpose (docs/CULTURE_PLAN.md §9): direct
 *  P921/P674/P144/P941, via myth/legend bases, via opera roles based on the
 *  figure, and for music also depicts + release→track (P658). Literary-work
 *  bases (Ovid, Dante) are excluded so anthology characters don't flood shelves. */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const MAP_PATH = join(ROOT, 'data', 'wikidata-map.json');
const OUT_DIR = join(ROOT, 'research', 'culture-candidates');
const USER_AGENT =
  'IcarusAtlas-culture-harvest/1.0 (https://github.com/e7hdk/icarus-atlas; research tooling)';
const SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';
const PER_BUCKET_LIMIT = 15;

/** Work classes per shelf bucket. Matched via instance-of (P31/P279*) or,
 *  for music, genre (P136) — operas are often P31=dramatico-musical work
 *  with P136=opera, so P31 alone misses Monteverdi/Gluck. */
type AboutMode = 'narrative' | 'depicts' | 'music';

const BUCKETS: {
  key: string;
  label: string;
  about: AboutMode;
  classes: string[];
  /** Preferred creator properties (SAMPLE still picks one; order is documentary). */
  creators: string;
}[] = [
  {
    key: 'screen',
    label: 'On screen',
    about: 'narrative',
    classes: ['Q11424', 'Q5398426'],
    creators: 'wdt:P57',
  },
  {
    key: 'music',
    label: 'In music & on stage',
    about: 'music',
    classes: [
      'Q1344', // opera
      'Q40831', // ballet
      'Q7366', // song
      'Q482994', // album
      'Q2743', // musical
      'Q58483083', // dramatico-musical work
      'Q134556', // single
      'Q105543609', // musical work/composition
      'Q2188189', // musical work
    ],
    creators: 'wdt:P86|wdt:P175',
  },
  {
    key: 'play',
    label: 'In play',
    about: 'narrative',
    classes: ['Q7889', 'Q1004', 'Q8261'],
    creators: 'wdt:P178|wdt:P50|wdt:P170',
  },
  {
    key: 'art',
    label: 'Artworks & artifacts',
    about: 'depicts',
    classes: ['Q3305213', 'Q860861', 'Q245117'],
    creators: 'wdt:P170',
  },
];

interface Candidate {
  qid: string;
  title: string;
  year?: string;
  creator?: string;
  collection?: string;
  sitelinks: number;
  wikipedia: string;
  image?: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function request(url: string, init?: RequestInit): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(url, {
      ...init,
      headers: { 'user-agent': USER_AGENT, ...init?.headers },
    });
    if ((response.status === 429 || response.status >= 500) && attempt < 4) {
      const wait = 15_000 * (attempt + 1); // WDQS sometimes caps at 1 req/min
      console.log(`    …${response.status} from ${new URL(url).host}, retrying in ${wait / 1000}s`);
      await sleep(wait);
      continue;
    }
    return response;
  }
}

function loadJson<T>(path: string): T | null {
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as T;
  } catch {
    return null;
  }
}

/** QID via the figure's reference Wikipedia article (the safe path). */
async function qidFromReference(id: string): Promise<string | null> {
  const reference = loadJson<{ externalLinks?: { url: string }[] }>(
    join(ROOT, 'data', 'reference', `${id}.json`),
  );
  const wiki = reference?.externalLinks?.find((link) =>
    link.url.startsWith('https://en.wikipedia.org/wiki/'),
  );
  if (!wiki) return null;
  const title = decodeURIComponent(wiki.url.split('/wiki/')[1] ?? '').split('#')[0];
  if (!title) return null;
  const api = `https://en.wikipedia.org/w/api.php?action=query&prop=pageprops&ppprop=wikibase_item&redirects=1&format=json&titles=${encodeURIComponent(title)}`;
  const response = await request(api);
  if (!response.ok) return null;
  const body = (await response.json()) as {
    query?: { pages?: Record<string, { pageprops?: { wikibase_item?: string } }> };
  };
  const pages = Object.values(body.query?.pages ?? {});
  return pages[0]?.pageprops?.wikibase_item ?? null;
}

/** Guarded name search — refuses anything ambiguous (the homonym rule). */
async function qidFromSearch(name: string): Promise<{ qid?: string; options: string[] }> {
  const api = `https://www.wikidata.org/w/api.php?action=wbsearchentities&language=en&type=item&limit=6&format=json&search=${encodeURIComponent(name)}`;
  const response = await request(api);
  if (!response.ok) return { options: [] };
  const body = (await response.json()) as {
    search?: { id: string; label?: string; description?: string }[];
  };
  const hits = body.search ?? [];
  const mythy = hits.filter((hit) => /greek|myth/i.test(hit.description ?? ''));
  if (mythy.length === 1) return { qid: mythy[0].id, options: [] };
  return {
    options: hits.map((hit) => `${hit.id} — ${hit.label ?? '?'} (${hit.description ?? 'no description'})`),
  };
}

async function sparql(query: string): Promise<Candidate[]> {
  const response = await request(SPARQL_ENDPOINT, {
    method: 'POST',
    headers: {
      accept: 'application/sparql-results+json',
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: `query=${encodeURIComponent(query)}`,
  });
  if (!response.ok) {
    throw new Error(`SPARQL ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }
  const body = (await response.json()) as {
    results: { bindings: Record<string, { value: string } | undefined>[] };
  };
  return body.results.bindings.map((row) => ({
    qid: row.work?.value.split('/').pop() ?? '',
    title: row.workLabel?.value ?? '',
    year: row.year?.value,
    creator: row.creator?.value,
    collection: row.collection?.value,
    sitelinks: Number(row.sitelinks?.value ?? 0),
    wikipedia: row.article?.value ?? '',
    image: row.image?.value,
  }));
}

/** How a work is "about" the figure. Direct subject/character links miss most
 *  reception: Gluck's Orfeo links via a *role* based on Orpheus; Hadestown is
 *  based on the Orpheus & Eurydice *legend* that lists him as a character;
 *  Iron Maiden's Flight of Icarus only *depicts* him (on the song entity; the
 *  Wikipedia-linked single points at that track via P658).
 *
 *  viaBasis is whitelisted to myth/legend/theme items — never literary works
 *  like Ovid's Metamorphoses, which list dozens of figures as characters and
 *  would flood every shelf with unrelated operas. */
function aboutPattern(qid: string, mode: AboutMode): string {
  const direct = `
    { ?work wdt:P921 wd:${qid} } UNION
    { ?work wdt:P674 wd:${qid} } UNION
    { ?work wdt:P144 wd:${qid} } UNION
    { ?work wdt:P941 wd:${qid} }`;
  // Q28061934 couple of mythological Greek characters · Q1406161 artistic theme ·
  // Q5434358 myth · Q1186287 Greek myth · Q272404 narrative
  const viaBasis = `
    { ?work wdt:P144 ?basis .
      ?basis wdt:P31 ?basisType .
      VALUES ?basisType { wd:Q28061934 wd:Q1406161 wd:Q5434358 wd:Q1186287 wd:Q272404 }
      { ?basis wdt:P921 wd:${qid} } UNION
      { ?basis wdt:P674 wd:${qid} } UNION
      { ?basis wdt:P144 wd:${qid} }
    }`;
  const viaRole = `
    { ?work wdt:P674 ?role .
      { ?role wdt:P144 wd:${qid} } UNION
      { ?role wdt:P941 wd:${qid} } }`;
  const depicts = `{ ?work wdt:P180 wd:${qid} }`;
  // Single/album → track that depicts or is about the figure (enwiki is on the release).
  const viaTrack = `
    { ?work wdt:P658 ?track .
      { ?track wdt:P180 wd:${qid} } UNION
      { ?track wdt:P921 wd:${qid} } UNION
      { ?track wdt:P941 wd:${qid} } }`;

  if (mode === 'depicts') return depicts;
  if (mode === 'music') {
    return `${direct} UNION ${viaBasis} UNION ${viaRole} UNION ${depicts} UNION ${viaTrack}`;
  }
  return `${direct} UNION ${viaBasis} UNION ${viaRole}`;
}

function classPattern(bucket: (typeof BUCKETS)[number]): string {
  const classValues = bucket.classes.map((c) => `wd:${c}`).join(' ');
  // Music: also match genre (P136). Screen/play/art stay on instance-of.
  if (bucket.about === 'music') {
    return `
  { ?work wdt:P31/wdt:P279* ?class } UNION { ?work wdt:P136 ?class }
  VALUES ?class { ${classValues} }`;
  }
  return `
  ?work wdt:P31/wdt:P279* ?class .
  VALUES ?class { ${classValues} }`;
}

function bucketQuery(qid: string, bucket: (typeof BUCKETS)[number]): string {
  return `
SELECT ?work ?workLabel
       (SAMPLE(YEAR(?date)) AS ?year)
       (SAMPLE(?creatorLabel) AS ?creator)
       (SAMPLE(?collectionLabel) AS ?collection)
       (MAX(?links) AS ?sitelinks)
       (SAMPLE(?enwiki) AS ?article)
       (SAMPLE(?img) AS ?image)
WHERE {
  ${aboutPattern(qid, bucket.about)}
  ${classPattern(bucket)}
  ?work wikibase:sitelinks ?links .
  ?enwiki schema:about ?work ;
          schema:isPartOf <https://en.wikipedia.org/> .
  OPTIONAL { ?work wdt:P577 ?date . }
  OPTIONAL { ?work wdt:P571 ?date . }
  OPTIONAL {
    ?work ${bucket.creators} ?creatorEntity .
    ?creatorEntity rdfs:label ?creatorLabel . FILTER(LANG(?creatorLabel) = "en")
  }
  OPTIONAL {
    ?work wdt:P195 ?collectionEntity .
    ?collectionEntity rdfs:label ?collectionLabel . FILTER(LANG(?collectionLabel) = "en")
  }
  OPTIONAL { ?work wdt:P18 ?img . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
GROUP BY ?work ?workLabel
ORDER BY DESC(?sitelinks)
LIMIT ${PER_BUCKET_LIMIT}`;
}

async function harvest(id: string, qidMap: Record<string, string>): Promise<boolean> {
  const character = loadJson<{ name: string }>(join(ROOT, 'data', 'characters', `${id}.json`));
  if (!character) {
    console.error(`✗ ${id}: no such character in data/characters/`);
    return false;
  }

  let qid = qidMap[id];
  if (!qid) {
    const fromReference = await qidFromReference(id);
    if (fromReference) {
      qid = fromReference;
      console.log(`  QID via reference article: ${qid}`);
    } else {
      const searched = await qidFromSearch(character.name);
      if (searched.qid) {
        qid = searched.qid;
        console.log(`  QID via guarded search: ${qid}`);
      } else {
        console.error(`✗ ${id}: could not resolve a QID unambiguously.`);
        if (searched.options.length) {
          console.error('  Candidates — pin the right one in data/wikidata-map.json:');
          searched.options.forEach((option) => console.error(`    ${option}`));
        }
        return false;
      }
    }
    qidMap[id] = qid;
  } else {
    console.log(`  QID from data/wikidata-map.json: ${qid}`);
  }

  const buckets: Record<string, Candidate[]> = {};
  for (const bucket of BUCKETS) {
    await sleep(2000); // WDQS is aggressive under load; be a polite client
    const candidates = await sparql(bucketQuery(qid, bucket));
    buckets[bucket.key] = candidates;
    console.log(`  ${bucket.label}: ${candidates.length} candidate(s)`);
    for (const candidate of candidates.slice(0, 8)) {
      const bits = [
        candidate.year,
        candidate.creator,
        candidate.collection,
        `${candidate.sitelinks} sitelinks`,
      ]
        .filter(Boolean)
        .join(' · ');
      console.log(`    · ${candidate.title}${bits ? ` (${bits})` : ''}`);
    }
  }

  mkdirSync(OUT_DIR, { recursive: true });
  const outPath = join(OUT_DIR, `${id}.json`);
  writeFileSync(
    outPath,
    JSON.stringify(
      { id, qid, harvestedAt: new Date().toISOString(), source: 'wikidata', buckets },
      null,
      2,
    ) + '\n',
    'utf-8',
  );
  console.log(`  → research/culture-candidates/${id}.json\n`);
  return true;
}

async function main() {
  const ids = process.argv.slice(2).filter((arg) => !arg.startsWith('-'));
  if (ids.length === 0) {
    console.error('Usage: pnpm harvest:culture <character-id> [more-ids…]');
    process.exit(1);
  }
  const qidMap = loadJson<Record<string, string>>(MAP_PATH) ?? {};
  let failures = 0;
  for (const id of ids) {
    console.log(`Harvesting ${id} …`);
    try {
      if (!(await harvest(id, qidMap))) failures++;
    } catch (error) {
      failures++;
      console.error(`✗ ${id}: ${error instanceof Error ? error.message : error}`);
    }
  }
  const sorted = Object.fromEntries(Object.entries(qidMap).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(MAP_PATH, JSON.stringify(sorted, null, 2) + '\n', 'utf-8');
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  process.exit(failures > 0 ? 1 : 0);
}

main();
