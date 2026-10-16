import type { PieceKind } from './piece-kind';

/** Orientation: 0 spawn, 1 clockwise, 2 half turn, 3 counter-clockwise. */
export type Rotation = 0 | 1 | 2 | 3;

/** A cell or kick offset; `y` grows upward like the board. */
export interface Offset {
  readonly x: number;
  readonly y: number;
}

type Quad<T> = readonly [T, T, T, T];

/** The four cells of a piece in its box. */
export type Cells = Quad<Offset>;

// Each rotation is drawn top row first inside the piece's box (4 × 4 for I, 3 × 3 otherwise).
const DRAWINGS: Readonly<Record<PieceKind, Quad<readonly string[]>>> = {
  I: [
    ['....', 'XXXX', '....', '....'],
    ['..X.', '..X.', '..X.', '..X.'],
    ['....', '....', 'XXXX', '....'],
    ['.X..', '.X..', '.X..', '.X..'],
  ],
  O: [
    ['.XX', '.XX', '...'],
    ['.XX', '.XX', '...'],
    ['.XX', '.XX', '...'],
    ['.XX', '.XX', '...'],
  ],
  T: [
    ['.X.', 'XXX', '...'],
    ['.X.', '.XX', '.X.'],
    ['...', 'XXX', '.X.'],
    ['.X.', 'XX.', '.X.'],
  ],
  S: [
    ['.XX', 'XX.', '...'],
    ['.X.', '.XX', '..X'],
    ['...', '.XX', 'XX.'],
    ['X..', 'XX.', '.X.'],
  ],
  Z: [
    ['XX.', '.XX', '...'],
    ['..X', '.XX', '.X.'],
    ['...', 'XX.', '.XX'],
    ['.X.', 'XX.', 'X..'],
  ],
  J: [
    ['X..', 'XXX', '...'],
    ['.XX', '.X.', '.X.'],
    ['...', 'XXX', '..X'],
    ['.X.', '.X.', 'XX.'],
  ],
  L: [
    ['..X', 'XXX', '...'],
    ['.X.', '.X.', '.XX'],
    ['...', 'XXX', 'X..'],
    ['XX.', '.X.', '.X.'],
  ],
};

function parse(rows: readonly string[]): Cells {
  const cells: Offset[] = [];
  for (let row = 0; row < rows.length; row += 1) {
    const line = rows[row] ?? '';
    for (let col = 0; col < line.length; col += 1) {
      if (line[col] === 'X') cells.push({ x: col, y: rows.length - 1 - row });
    }
  }
  const [a, b, c, d] = cells;
  if (a === undefined || b === undefined || c === undefined || d === undefined) {
    throw new Error('A piece drawing must hold exactly four cells');
  }
  return Object.freeze([a, b, c, d]);
}

function build(drawings: Quad<readonly string[]>): Quad<Cells> {
  return [parse(drawings[0]), parse(drawings[1]), parse(drawings[2]), parse(drawings[3])];
}

const SHAPES: Readonly<Record<PieceKind, Quad<Cells>>> = {
  I: build(DRAWINGS.I),
  O: build(DRAWINGS.O),
  T: build(DRAWINGS.T),
  S: build(DRAWINGS.S),
  Z: build(DRAWINGS.Z),
  J: build(DRAWINGS.J),
  L: build(DRAWINGS.L),
};

/** The four cells of a piece in its box, `y` upward. The returned tuple is shared: never mutate it. */
export function shape(kind: PieceKind, rotation: Rotation): Cells {
  return SHAPES[kind][rotation];
}

/** The wall-kick offsets to try, in order. */
export type KickTests = readonly Offset[];

function tests(...pairs: readonly (readonly [number, number])[]): KickTests {
  return pairs.map(([x, y]) => ({ x, y }));
}

// SRS wall-kick tests (Guideline), `y` upward. Indexed by the starting rotation, then
// [clockwise, counter-clockwise].
const JLSTZ_KICKS: Quad<readonly [KickTests, KickTests]> = [
  [
    tests([0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]),
    tests([0, 0], [1, 0], [1, 1], [0, -2], [1, -2]),
  ],
  [tests([0, 0], [1, 0], [1, -1], [0, 2], [1, 2]), tests([0, 0], [1, 0], [1, -1], [0, 2], [1, 2])],
  [
    tests([0, 0], [1, 0], [1, 1], [0, -2], [1, -2]),
    tests([0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]),
  ],
  [
    tests([0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]),
    tests([0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]),
  ],
];

const I_KICKS: Quad<readonly [KickTests, KickTests]> = [
  [
    tests([0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]),
    tests([0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]),
  ],
  [
    tests([0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]),
    tests([0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]),
  ],
  [
    tests([0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]),
    tests([0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]),
  ],
  [
    tests([0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]),
    tests([0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]),
  ],
];

const NO_KICK = tests([0, 0]);

/**
 * The SRS offsets to try, in order, when rotating by a quarter turn; the first is always (0, 0).
 * O never kicks. The returned array is shared: never mutate it.
 * @throws RangeError when `to` is not a quarter turn away from `from`.
 */
export function kicks(kind: PieceKind, from: Rotation, to: Rotation): KickTests {
  const turn = (to - from + 4) % 4;
  if (turn !== 1 && turn !== 3) {
    throw new RangeError(`Not a quarter turn: ${String(from)} -> ${String(to)}`);
  }
  if (kind === 'O') return NO_KICK;
  return (kind === 'I' ? I_KICKS : JLSTZ_KICKS)[from][turn === 1 ? 0 : 1];
}
