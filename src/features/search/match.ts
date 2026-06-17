import type { Character } from '@/types/character';

/** One character matched by a search query, with the matched range for highlighting. */
export interface SearchHit {
  character: Character;
  /** Field the query matched; non-name fields render as a context line under the name. */
  field: 'name' | 'romanName' | 'greekName' | 'epithet' | 'domain';
  /** Exact field value the match was found in. */
  value: string;
  /** [start, end) of the match within `value`. */
  start: number;
  end: number;
}

interface ScoredHit extends SearchHit {
  score: number;
}

/** Name matches always outrank alternate names, which outrank epithets/domains. */
const FIELD_WEIGHT: Record<SearchHit['field'], number> = {
  name: 3,
  romanName: 2,
  greekName: 2,
  epithet: 1,
  domain: 0,
};

/** Fold to lowercase ASCII-ish form one UTF-16 unit at a time so indexes into the
 *  folded string map 1:1 back onto the original (needed for highlight ranges). */
export function fold(text: string): string {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const folded = text[i]
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase();
    out += folded.length > 0 ? folded[0] : text[i];
  }
  return out;
}

export function matchIn(
  value: string,
  query: string,
): { start: number; end: number; score: number } | null {
  const folded = fold(value);
  const index = folded.indexOf(query);
  if (index < 0) return null;
  const atStart = index === 0;
  const atWordStart = atStart || /[^a-z0-9]/.test(folded[index - 1]);
  return {
    start: index,
    end: index + query.length,
    score: (atStart ? 40 : atWordStart ? 25 : 10) - index * 0.1,
  };
}

/** Rank characters against a query; each character contributes its single best field match. */
export function searchCharacters(characters: Character[], rawQuery: string, limit = 8): SearchHit[] {
  const query = fold(rawQuery.trim());
  if (!query) return [];

  const hits: ScoredHit[] = [];
  for (const character of characters) {
    const candidates: [SearchHit['field'], string][] = [
      ['name', character.name],
      ['greekName', character.greekName],
    ];
    if (character.romanName) candidates.push(['romanName', character.romanName]);
    for (const epithet of character.epithets ?? []) candidates.push(['epithet', epithet]);
    for (const domain of character.domains) candidates.push(['domain', domain]);

    let best: ScoredHit | null = null;
    for (const [field, value] of candidates) {
      const match = matchIn(value, query);
      if (!match) continue;
      const score = match.score + FIELD_WEIGHT[field] * 50;
      if (!best || score > best.score) {
        best = { character, field, value, start: match.start, end: match.end, score };
      }
    }
    if (best) hits.push(best);
  }

  hits.sort((a, b) => b.score - a.score || a.character.name.localeCompare(b.character.name));
  return hits.slice(0, limit);
}
