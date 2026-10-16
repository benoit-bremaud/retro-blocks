import type { PieceKind } from './piece-kind';
import type { Rotation } from './srs';

/** A falling piece: `x`, `y` are the bottom-left corner of its box (`y` upward). */
export interface ActivePiece {
  readonly kind: PieceKind;
  readonly rotation: Rotation;
  readonly x: number;
  readonly y: number;
}

/** Spawn position: box at column 3, row 19, so the piece fills rows 20–21 centred (GDD §3). */
export function spawnPiece(kind: PieceKind): ActivePiece {
  return { kind, rotation: 0, x: 3, y: 19 };
}
