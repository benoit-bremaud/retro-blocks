import { VISIBLE_ROWS } from './board-size';
import type { PieceKind } from './piece-kind';
import type { Rotation } from './srs';

/** A falling piece: `x`, `y` are the bottom-left corner of its box (`y` upward). */
export interface ActivePiece {
  readonly kind: PieceKind;
  readonly rotation: Rotation;
  readonly x: number;
  readonly y: number;
}

const SPAWN_X = 3;
const SPAWN_Y = VISIBLE_ROWS - 1;

/** Spawn position: box at column 3, row 19. Every piece lies within rows 20–21 (I only on row 21), centred (GDD §3). */
export function spawnPiece(kind: PieceKind): ActivePiece {
  return { kind, rotation: 0, x: SPAWN_X, y: SPAWN_Y };
}
