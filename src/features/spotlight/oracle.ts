/** The Daily Oracle (docs/EPHEMERIS_PLAN.md §11) — up to three deterministic
 *  questions drawn from the day's star, seeded by date + star so every
 *  visitor faces the same oracle. Everything quoted is existing sourced
 *  data; nothing is invented:
 *    bond — complete a relation edge, distractors from same-type stars
 *    poet — which teller says a quarrel variant (options are the variants'
 *           own source labels; no synthetic fillers, so the style matches)
 *    myth — which story carries the star, distractors from the saga shelf
 *           minus every myth that truly casts the star (payload.storyTitles)
 *    role — the cosmic-role fallback that keeps the oracle at three. */

import { hashString, mulberry32 } from '@/lib/prng';
import { CHARACTER_TYPES } from '@/types/character';
import type { EphemerisCardPayload, EphemerisData, OracleQuestion } from '@/types/spotlight';

/** Case- and diacritic-blind name folding, shared with the riddle's guess
 *  matching — "eeriboea" finds "Eëriboea", and the two Creons collide. */
export function foldName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

function seededShuffle<T>(items: readonly T[], rng: () => number): T[] {
  const deck = [...items];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function buildOracle(
  payload: EphemerisCardPayload,
  data: EphemerisData,
  isoDate: string,
): OracleQuestion[] {
  const rng = mulberry32(hashString(`oracle-${isoDate}-${payload.id}`));
  const questions: OracleQuestion[] = [];

  if (payload.bonds.length > 0) {
    const bond = payload.bonds[Math.floor(rng() * payload.bonds.length)];
    const otherType = data.roster.find((entry) => entry.id === bond.otherId)?.type;
    const pool = data.roster.filter(
      (entry) =>
        entry.id !== bond.otherId &&
        entry.id !== payload.id &&
        (otherType ? entry.type === otherType : true),
    );
    // Homonyms (the two Creons) must not meet in one option list — dedupe by
    // folded name, with the correct answer's name reserved first.
    const seenNames = new Set([foldName(bond.otherName), foldName(payload.name)]);
    const distractors: string[] = [];
    for (const entry of seededShuffle(pool, rng)) {
      const folded = foldName(entry.name);
      if (seenNames.has(folded)) continue;
      seenNames.add(folded);
      distractors.push(entry.name);
      if (distractors.length === 3) break;
    }
    if (distractors.length >= 2) {
      const options = seededShuffle([bond.otherName, ...distractors], rng);
      questions.push({
        kind: 'bond',
        prompt: `Complete the bond — ${payload.name}, ${bond.label} …`,
        options,
        correctIndex: options.indexOf(bond.otherName),
      });
    }
  }

  if (payload.quarrel && payload.quarrel.variants.length >= 2) {
    const variant =
      payload.quarrel.variants[Math.floor(rng() * payload.quarrel.variants.length)];
    const labels = [...new Set(payload.quarrel.variants.map((entry) => entry.sourceLabel))];
    if (labels.length >= 2) {
      const options = seededShuffle(labels, rng);
      const text =
        variant.text.length > 160 ? `${variant.text.slice(0, 157).trimEnd()}…` : variant.text;
      questions.push({
        kind: 'poet',
        prompt: `Who tells it so — “${text}”?`,
        options,
        correctIndex: options.indexOf(variant.sourceLabel),
      });
    }
  }

  if (payload.storyTitle) {
    // A wrong answer must be a myth the star truly never walks in. The shelf
    // alone can't tell — its casts stop at the saga root — so the payload
    // carries the star's full appearance set (stories plus their parent
    // sagas). Without it, Athena's oracle dealt the Argonautica as a wrong
    // answer while she stands on the Argo's deck.
    const featured = new Set(payload.storyTitles);
    const others = data.weeks.sagas
      .map((saga) => saga.title)
      .filter((title) => title !== payload.storyTitle && !featured.has(title));
    const distractors = seededShuffle(others, rng).slice(0, 3);
    if (distractors.length >= 2) {
      const options = seededShuffle([payload.storyTitle, ...distractors], rng);
      questions.push({
        kind: 'myth',
        prompt: `In which myth does ${payload.name} appear?`,
        options,
        correctIndex: options.indexOf(payload.storyTitle),
      });
    }
  }

  if (questions.length < 3) {
    const others = seededShuffle(
      CHARACTER_TYPES.filter((type) => type !== payload.type),
      rng,
    ).slice(0, 3);
    const options = seededShuffle([payload.type as string, ...others], rng);
    questions.push({
      kind: 'role',
      prompt: `Which cosmic role does ${payload.name} hold?`,
      options,
      correctIndex: options.indexOf(payload.type),
    });
  }

  return questions.slice(0, 3);
}

/** Veil the star's names for the riddle — an em-dash curtain, case-blind. */
export function maskStarName(text: string, payload: EphemerisCardPayload): string {
  const names = [payload.name, payload.romanName].filter((name): name is string =>
    Boolean(name),
  );
  let masked = text;
  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    masked = masked.replace(new RegExp(escaped, 'gi'), '———');
  }
  return masked;
}
