/** Shared tab config for city codex routes (lineage + sky). */
export const CITY_TABS = [
  { key: 'lineage' as const, label: 'Lineage', path: '' },
  { key: 'sky' as const, label: 'City sky', path: '/sky' },
];

export type CityTab = (typeof CITY_TABS)[number]['key'];
