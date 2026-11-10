/** What a reading-room deep link points at (docs/LIBRARY_PLAN.md §6):
 *  `#l370-417` a run of lines, `#s1.3.1` a section or a run of them, `#t92` a tale. */

/** 929 < 929a < 930; 1.9 < 1.10 */
function compareIds(a: string, b: string): number {
  const left = a.split('.');
  const right = b.split('.');
  for (let i = 0; i < Math.min(left.length, right.length); i++) {
    const delta = Number.parseInt(left[i], 10) - Number.parseInt(right[i], 10);
    if (delta !== 0) return delta;
    const letter = left[i].replace(/^\d+/, '').localeCompare(right[i].replace(/^\d+/, ''));
    if (letter !== 0) return letter;
  }
  return 0;
}

const within = (id: string, from: string, to: string) => compareIds(id, from) >= 0 && compareIds(id, to) <= 0;

/** The lines or blocks of `root` that `hash` names, in reading order. */
export function targetsOf(root: HTMLElement, hash: string): HTMLElement[] {
  const lines = /^#l([\dA-Za-z]+)(?:-([\dA-Za-z]+))?$/.exec(hash);
  if (lines) {
    const [, from, to = lines[1]] = lines;
    return [...root.querySelectorAll<HTMLElement>('.lib-line')].filter((line) => within(line.dataset.n ?? '', from, to));
  }
  const sections = /^#s([\d.]+)(?:-([\d.]+))?$/.exec(hash);
  if (sections) {
    const [, from, to = sections[1]] = sections;
    return [...root.querySelectorAll<HTMLElement>('.lib-block')].filter((block) => {
      const id = block.dataset.from ?? '';
      return within(id, from, to) || id.startsWith(`${from}.`) || id.startsWith(`${to}.`);
    });
  }
  const tale = /^#t(.+)$/.exec(hash);
  if (tale) return [...root.querySelectorAll<HTMLElement>('.lib-block')].filter((block) => block.dataset.from === decodeURIComponent(tale[1]));
  return [];
}
