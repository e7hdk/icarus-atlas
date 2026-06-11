import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHARACTERS_DIR = path.join(__dirname, '../data/characters');
const CULTURE_DIR = path.join(__dirname, '../data/culture');

async function fetchWikipediaSummary(title: string) {
  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.extract;
  } catch (e) {
    return null;
  }
}

// A simple map to handle Wikipedia page titles that differ from the character name
const WIKI_TITLE_MAP: Record<string, string> = {
  'aphrodite': 'Aphrodite',
  'apollo': 'Apollo',
  'ares': 'Ares',
  'artemis': 'Artemis',
  'athena': 'Athena',
  'zeus': 'Zeus',
  'hades': 'Hades',
  'poseidon': 'Poseidon',
  'hera': 'Hera',
  'demeter': 'Demeter',
  'hestia': 'Hestia',
  'hermes': 'Hermes',
  'hephaestus': 'Hephaestus',
  'dionysus': 'Dionysus',
  // Add more as needed, others will use the capitalized ID
};

async function main() {
  await fs.mkdir(CULTURE_DIR, { recursive: true });
  const files = await fs.readdir(CHARACTERS_DIR);
  
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const id = file.replace('.json', '');
    const title = WIKI_TITLE_MAP[id] || id.charAt(0).toUpperCase() + id.slice(1);
    
    console.log(`Fetching data for ${id} (Wiki: ${title})...`);
    
    const summary = await fetchWikipediaSummary(title);
    
    // Mocking artwork for now to establish the UI structure
    // A real implementation would use Wikidata SPARQL: ?artwork wdt:P921 wd:[CharacterEntityID]
    const artworks = [
      {
        title: `Birth of ${title}`,
        artist: 'Renaissance Master',
        year: '1500s',
        imageUrl: `https://picsum.photos/seed/${id}1/800/600`
      },
      {
        title: `${title} Triumphant`,
        artist: 'Classical Sculptor',
        year: '2nd Century BC',
        imageUrl: `https://picsum.photos/seed/${id}2/600/800`
      }
    ];

    const cultureData = {
      id,
      wikipediaSummary: summary || `${title} is a prominent figure in Greek mythology.`,
      artworks
    };

    await fs.writeFile(
      path.join(CULTURE_DIR, file),
      JSON.stringify(cultureData, null, 2)
    );
    // Add small delay to respect rate limits
    await new Promise((r) => setTimeout(r, 100));
  }
  
  console.log('Finished fetching cultural legacy data.');
}

main().catch(console.error);
