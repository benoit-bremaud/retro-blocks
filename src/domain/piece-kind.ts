/** The seven tetromino kinds, in the order a fresh bag is laid out before shuffling (GDD §3). */
export const PIECE_KINDS = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'] as const;

/** One of the seven piece kinds. */
export type PieceKind = (typeof PIECE_KINDS)[number];
