/** Seals a gift's score for a dedication's door (src/features/dedication).
 *
 *  The score is a private module, its default export a GiftScore, and is kept
 *  out of the repository: the atlas is public, and a gift is for one reader.
 *  This checks the score, seals it under the passphrase and writes the one
 *  file the site ships. The passphrase is read from the environment variable
 *  DEDICATION_KEY and is written nowhere.
 *
 *  Run with: pnpm seal-dedication <score module> <out file> */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { giftSchema, type GiftScore } from '../src/features/dedication/score';
import { deriveKey, openSealed, sealJson } from '../src/features/dedication/seal';

async function main(): Promise<void> {
  const [source, out] = process.argv.slice(2);
  const passphrase = process.env.DEDICATION_KEY;
  if (!source || !out || !passphrase) {
    console.error('Usage: pnpm seal-dedication <score module> <out file>, the passphrase in the environment variable DEDICATION_KEY');
    process.exit(1);
  }

  const loaded = (await import(pathToFileURL(resolve(source)).href)) as { default: unknown };
  const gift = giftSchema.parse(loaded.default);

  const spoken = gift.track.filter((entry) => entry.n !== null).map((entry) => entry.n);
  const unspoken = gift.poem.map((_, index) => index).filter((index) => !spoken.includes(index));
  if (unspoken.length > 0) throw new Error(`Lines never spoken: ${unspoken.map((index) => index + 1).join(', ')}`);
  for (let index = 1; index < gift.track.length; index++) {
    if (gift.track[index].t < gift.track[index - 1].t) throw new Error(`Track out of order at entry ${index}`);
  }
  for (const note of gift.notes) {
    if (note.to < note.from || note.to > gift.poem.length) throw new Error(`Note off the poem: ${note.from}–${note.to}`);
  }

  const sealed = await sealJson(gift, passphrase);
  // The proof: the file opens again under the same passphrase, to the same score.
  const again = await openSealed<GiftScore>(sealed, await deriveKey(passphrase, sealed.kdf));
  if (JSON.stringify(again) !== JSON.stringify(gift)) throw new Error('The seal did not open to what it closed');

  mkdirSync(dirname(resolve(out)), { recursive: true });
  const text = `${JSON.stringify(sealed)}\n`;
  writeFileSync(out, text);
  const minutes = `${Math.floor(gift.end / 60)}:${String(Math.round(gift.end % 60)).padStart(2, '0')}`;
  console.log(`Sealed ${gift.poem.length} lines, ${gift.cues.length} cues, ${minutes} → ${out} (${text.length} bytes)`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
