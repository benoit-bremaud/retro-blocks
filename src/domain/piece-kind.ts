/** The seven tetromino kinds, in bag layout order (GDD §3). Index + 1 is also the locked-cell code in `Board`: do not reorder. */
export const PIECE_KINDS = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'] as const;

/** Code stored in a board cell for `kind`: its index + 1, 0 being an empty cell. */
export function cellCode(kind: PieceKind): number {
  return PIECE_KINDS.indexOf(kind) + 1;
}

/** One of the seven piece kinds. */
export type PieceKind = (typeof PIECE_KINDS)[number];
