import 'server-only';
import quarrelsJson from '../../../data/quarrels.json';
import { createCitationResolver } from './cite';
import { compareIds } from './extents';
import { LIBRARY_REGISTRY, libraryWork, passageLink, unitOf, type PassageLink } from './links';
import { loadLibraryText } from './load';
import { covered } from './margins';
import { resolveSaga, SAGA_ORDER, type SagaId } from '@/features/stories/sagas';
import type { CharacterType } from '@/types/character';
import type { CiteRef, LibraryBlock } from '@/types/library';
import type { Quarrel, QuarrelClaim, QuarrelsFile } from '@/types/quarrel';
import type { Story } from '@/types/story';

/** The Quarrels as the Library reads them (docs/LIBRARY_PLAN.md §7): the catalogue
 *  of `data/quarrels.json`, each claim in its teller's place in time and in the
 *  teller's own words, and each quarrel under the saga it belongs to. */

export const QUARRELS: Quarrel[] = (quarrelsJson as unknown as QuarrelsFile).quarrels;
export const findQuarrel = (topic: string): Quarrel | null => QUARRELS.find((quarrel) => quarrel.topic === topic) ?? null;
export { claimsInTime, tellersOf } from './quarrel-order';

const resolver = createCitationResolver(LIBRARY_REGISTRY);

/** Where a quarrel belongs on the Spindle: the saga of the stories whose chapters
 *  carry its topic first, then the sagas its figures are cast in (the first figure,
 *  its subject, counting double); a quarrel no story touches goes by its subject's
 *  place in the cosmos. Ties go to the saga earlier on the Spindle. */
export function quarrelSaga(quarrel: Quarrel, stories: Story[], storyById: Map<string, Story>, types: Map<string, CharacterType>): SagaId {
  const score = new Map<SagaId, number>();
  const add = (saga: SagaId, weight: number) => score.set(saga, (score.get(saga) ?? 0) + weight);
  for (const story of stories) {
    if (story.summary.topic === quarrel.topic || story.chapters.some((chapter) => chapter.topic === quarrel.topic)) add(resolveSaga(story, storyById), 3);
  }
  quarrel.characters.forEach((id, index) => {
    const sagas = new Set(stories.filter((story) => story.cast.some((member) => member.id === id)).map((story) => resolveSaga(story, storyById)));
    for (const saga of sagas) add(saga, index === 0 ? 2 : 1);
  });
  const best = [...score].sort((a, b) => b[1] - a[1] || SAGA_ORDER.indexOf(a[0]) - SAGA_ORDER.indexOf(b[0]))[0];
  if (best) return best[0];
  const subject = types.get(quarrel.characters[0] ?? '');
  if (subject === 'primordial') return 'primordial';
  if (subject === 'titan') return 'titan';
  if (subject === 'olympian' || subject === 'god') return 'olympian';
  return 'heroic';
}

/** A claim's passage as the teller wrote it: the cited lines of the original (or
 *  the section), and the English that translates them. */
export interface ClaimPassage {
  link: PassageLink;
  lang: 'grc' | 'la';
  /** Verse: the cited lines of the original, each with its number. */
  lines: [n: string, text: string][];
  /** Prose: the cited sections of the original. */
  prose: string[];
  /** The cited lines run on past what is shown. */
  more: boolean;
  /** The English that translates them: the whole card for verse, which the
   *  translation does not number line by line. */
  english: string[];
  /** Where the English is read while its licence waits (L10). */
  out?: string;
}

type Passage = Extract<CiteRef, { kind: 'passage' }>;

/** Lines a claim may show of its original before it points to the passage. */
const MAX_LINES = 12;

async function passageText(ref: Passage): Promise<ClaimPassage | null> {
  const work = libraryWork(ref.work);
  const text = await loadLibraryText(ref.work);
  const unit = text.units.find((candidate) => candidate.id === unitOf(work, ref.from));
  if (!unit) return null;
  const blocks = covered(work, unit.blocks, ref.from, ref.to);
  if (blocks === 'broad' || blocks.length === 0) return null;
  const verse = work.structure === 'books-of-lines' || work.structure === 'lines';
  const passage: ClaimPassage = {
    link: passageLink(ref),
    lang: work.author === 'ovid' || work.author === 'hyginus' ? 'la' : 'grc',
    lines: [],
    prose: [],
    more: false,
    english: work.display === 'full' ? blocks.flatMap((block) => block.trans) : [],
    out: work.display === 'full' ? undefined : blocks.find((block) => block.link)?.link,
  };
  if (!verse) {
    passage.prose = blocks.map((block: LibraryBlock) => (typeof block.orig === 'string' ? block.orig : block.orig.map(([, line]) => line).join(' '))).filter(Boolean);
    return passage;
  }
  const from = ref.from.kind === 'line' ? ref.from.line : null;
  const to = ref.to.kind === 'line' && ref.from.kind === 'line' && ref.to.book === ref.from.book ? ref.to.line : null;
  const lines = blocks
    .flatMap((block) => (Array.isArray(block.orig) ? block.orig : []))
    .filter(([n]) => (from === null || compareIds(n, from) >= 0) && (to === null || compareIds(n, to) <= 0));
  passage.lines = lines.slice(0, MAX_LINES);
  passage.more = lines.length > MAX_LINES;
  return passage;
}

export interface ClaimReading {
  /** The first passages, with their words. */
  passages: ClaimPassage[];
  /** Every passage the citation names, as a link. */
  links: PassageLink[];
  /** The works it stands in, in the citation's order: "Iliad · c. 8th century BC". */
  works: string[];
}

/** A claim as the Library reads it: the first `shown` passages with their words. */
export async function claimReading(claim: QuarrelClaim, shown = 2): Promise<ClaimReading> {
  if (!claim.citation) return { passages: [], links: [], works: [] };
  const refs = resolver.resolve(claim.citation, { sources: claim.sources }).filter((ref): ref is Passage => ref.kind === 'passage');
  const links = [...new Map(refs.map((ref) => passageLink(ref)).map((link) => [link.href, link])).values()];
  const works = [...new Set(refs.map((ref) => ref.work))].map((id) => `${libraryWork(id).title} · ${libraryWork(id).composed.label}`);
  const passages = (await Promise.all(refs.slice(0, shown).map(passageText))).filter((passage): passage is ClaimPassage => passage !== null);
  return { passages, links, works };
}

/** Theogony 27–28, the Muses to Hesiod, from the pinned texts. */
export async function musesLine(): Promise<{ greek: string[]; english: string | null }> {
  const text = await loadLibraryText('theogony');
  const block = text.units[0]?.blocks.find((candidate) => compareIds(candidate.from, '27') <= 0 && compareIds(candidate.to, '28') >= 0);
  if (!block || !Array.isArray(block.orig)) return { greek: [], english: null };
  const greek = block.orig.filter(([n]) => n === '27' || n === '28').map(([, line]) => line);
  const english = /we know how to speak[^”"]*?true things\./.exec(block.trans.join(' '))?.[0] ?? null;
  return { greek, english: english && english.charAt(0).toUpperCase() + english.slice(1) };
}
