import type { Story } from '@/types/story';
import {
  isArgonauticaStory,
  isPrimordialStory,
  isTitanCycleStory,
  isOlympianCycleStory,
  isHeraclesCycleStory,
  isMetamorphosesStory,
  isPerseusCycleStory,
  isReturnsStory,
  isTheseusCycleStory,
  isThebanCycleStory,
  isDionysusCycleStory,
  isTrojanCycleStory,
  PRIMORDIAL_CYCLE_ROOT_IDS,
  TITAN_CYCLE_ROOT_IDS,
  OLYMPIAN_CYCLE_ROOT_IDS,
  ARGONAUTICA_ROOT_IDS,
  THEBAN_CYCLE_ROOT_IDS,
  DIONYSUS_CYCLE_ROOT_IDS,
  PERSEUS_CYCLE_ROOT_IDS,
  HERACLES_CYCLE_ROOT_IDS,
  THESEUS_CYCLE_ROOT_IDS,
  TROJAN_CYCLE_ROOT_IDS,
  RETURNS_ROOT_IDS,
  METAMORPHOSES_ROOT_IDS,
} from './shelves';

/** A saga of the Myths door: one colour — an arm of the Spindle, a family of
 *  streams in the River of Myth. */
export type SagaId =
  | 'primordial'
  | 'titan'
  | 'olympian'
  | 'argonaut'
  | 'theban'
  | 'dionysus'
  | 'perseus'
  | 'heracles'
  | 'theseus'
  | 'trojan'
  | 'returns'
  | 'metamorphoses'
  | 'heroic';

/** Saga accent colors — the single source of truth for the Myths palette. */
export const SAGA_ACCENT: Record<SagaId, string> = {
  primordial: '#a78bfa',
  titan: '#e3b341',
  olympian: '#7dd3fc',
  argonaut: '#38bdf8',
  theban: '#fb7185',
  dionysus: '#c026d3',
  perseus: '#eab308',
  heracles: '#f97316',
  theseus: '#2dd4bf',
  trojan: '#fbbf24',
  returns: '#34d399',
  metamorphoses: '#e879f9',
  heroic: '#aab4c8',
};

export const SAGA_LABEL: Record<SagaId, string> = {
  primordial: 'The Primordials',
  titan: 'The Titans',
  olympian: 'The Olympians',
  argonaut: 'The Argonautica',
  theban: 'The Theban Cycle',
  dionysus: 'The Dionysus Cycle',
  perseus: 'The Perseus Cycle',
  heracles: 'The Labours of Heracles',
  theseus: 'The Attic Cycle',
  trojan: 'The Trojan Cycle',
  returns: 'The Returns',
  metamorphoses: 'The Metamorphoses',
  heroic: 'Heroic Ages',
};

/** The legend order: the Spindle's arms go round in it, and the River of Myth
 *  stacks its streams by it wherever no meeting decides. */
export const SAGA_ORDER: SagaId[] = [
  'primordial',
  'titan',
  'olympian',
  'metamorphoses',
  'theban',
  'dionysus',
  'perseus',
  'argonaut',
  'heracles',
  'theseus',
  'trojan',
  'returns',
  'heroic',
];

/** The stories heading the sagas' shelves. */
export const SHELF_ROOT_IDS = new Set<string>([
  ...PRIMORDIAL_CYCLE_ROOT_IDS,
  ...TITAN_CYCLE_ROOT_IDS,
  ...OLYMPIAN_CYCLE_ROOT_IDS,
  ...ARGONAUTICA_ROOT_IDS,
  ...THEBAN_CYCLE_ROOT_IDS,
  ...DIONYSUS_CYCLE_ROOT_IDS,
  ...PERSEUS_CYCLE_ROOT_IDS,
  ...HERACLES_CYCLE_ROOT_IDS,
  ...THESEUS_CYCLE_ROOT_IDS,
  ...TROJAN_CYCLE_ROOT_IDS,
  ...RETURNS_ROOT_IDS,
  ...METAMORPHOSES_ROOT_IDS,
]);

/** Walks the parent chain to the shelf root that owns this story → its saga. */
export function resolveSaga(story: Story, byId: Map<string, Story>): SagaId {
  if (isPrimordialStory(story, byId)) return 'primordial';
  if (isTitanCycleStory(story, byId)) return 'titan';
  if (isOlympianCycleStory(story, byId)) return 'olympian';
  if (isReturnsStory(story, byId)) return 'returns';
  if (isTrojanCycleStory(story, byId)) return 'trojan';
  if (isArgonauticaStory(story, byId)) return 'argonaut';
  if (isThebanCycleStory(story, byId)) return 'theban';
  if (isDionysusCycleStory(story, byId)) return 'dionysus';
  if (isPerseusCycleStory(story, byId)) return 'perseus';
  if (isHeraclesCycleStory(story, byId)) return 'heracles';
  if (isTheseusCycleStory(story, byId)) return 'theseus';
  if (isMetamorphosesStory(story, byId)) return 'metamorphoses';
  return 'heroic';
}
