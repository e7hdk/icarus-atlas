'use client';

import type { StagePiece } from '@/features/dedication/director';
import type { Dedication } from '@/features/galaxy/dedication';
import type { Vec3 } from '@/features/galaxy/layout';
import { Arrow } from './Arrow';
import { Braid } from './Braid';
import { Chain } from './Chain';
import { Eyes } from './Eyes';
import { Guest } from './Guest';
import { NameInStars } from './NameInStars';
import { Wave } from './Wave';

/** The set pieces a score calls for, drawn in the sky beside its stars. Each
 *  reads the stage's time and draws that moment, so a pause or a step back
 *  costs it nothing. A name the stage does not know is drawn as nothing. */
export function StagePieces({ pieces, positions, dedication }: { pieces: StagePiece[]; positions: Map<string, Vec3>; dedication: Dedication }) {
  return (
    <>
      {pieces.map((piece, index) => {
        const key = `${piece.piece}-${index}`;
        switch (piece.piece) {
          case 'eyes':
            return <Eyes key={key} piece={piece} dedication={dedication} />;
          case 'guest':
            return <Guest key={key} piece={piece} positions={positions} />;
          case 'braid':
            return <Braid key={key} piece={piece} positions={positions} dedication={dedication} />;
          case 'name':
            return <NameInStars key={key} piece={piece} positions={positions} dedication={dedication} />;
          case 'chain':
            return <Chain key={key} piece={piece} positions={positions} dedication={dedication} />;
          case 'arrow':
            return <Arrow key={key} piece={piece} positions={positions} />;
          case 'wave':
            return <Wave key={key} piece={piece} positions={positions} dedication={dedication} />;
          default:
            return null;
        }
      })}
    </>
  );
}
