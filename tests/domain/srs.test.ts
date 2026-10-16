import { describe, expect, it } from 'vitest';
import { PIECE_KINDS } from '../../src/domain/piece-kind';
import { kicks, shape, type Offset, type Rotation } from '../../src/domain/srs';

const ROTATIONS: readonly Rotation[] = [0, 1, 2, 3];

function sorted(cells: readonly Offset[]): string[] {
  return cells.map((c) => `${String(c.x)},${String(c.y)}`).sort();
}

function cells(...pairs: readonly (readonly [number, number])[]): Offset[] {
  return pairs.map(([x, y]) => ({ x, y }));
}

describe('Srs.shape', () => {
  it.each([
    [
      'T',
      [
        [1, 2],
        [0, 1],
        [1, 1],
        [2, 1],
      ],
    ],
    [
      'S',
      [
        [1, 2],
        [2, 2],
        [0, 1],
        [1, 1],
      ],
    ],
    [
      'Z',
      [
        [0, 2],
        [1, 2],
        [1, 1],
        [2, 1],
      ],
    ],
    [
      'J',
      [
        [0, 2],
        [0, 1],
        [1, 1],
        [2, 1],
      ],
    ],
    [
      'L',
      [
        [2, 2],
        [0, 1],
        [1, 1],
        [2, 1],
      ],
    ],
    [
      'I',
      [
        [0, 2],
        [1, 2],
        [2, 2],
        [3, 2],
      ],
    ],
    [
      'O',
      [
        [1, 2],
        [2, 2],
        [1, 1],
        [2, 1],
      ],
    ],
  ] as const)('draws %s in its spawn state (y grows upward)', (kind, expected) => {
    expect(sorted(shape(kind, 0))).toEqual(sorted(cells(...expected)));
  });

  it('draws I vertically on column 2 after a clockwise turn', () => {
    expect(sorted(shape('I', 1))).toEqual(sorted(cells([2, 0], [2, 1], [2, 2], [2, 3])));
  });

  it('keeps O identical in every rotation', () => {
    for (const r of ROTATIONS) expect(sorted(shape('O', r))).toEqual(sorted(shape('O', 0)));
  });

  it.each(PIECE_KINDS.filter((kind) => kind !== 'O'))(
    'turns %s clockwise inside its box at every rotation',
    (kind) => {
      const size = kind === 'I' ? 4 : 3;
      for (const from of ROTATIONS) {
        const to = ((from + 1) % 4) as Rotation;
        const turned = shape(kind, from).map((c) => ({ x: c.y, y: size - 1 - c.x }));
        expect(sorted(shape(kind, to))).toEqual(sorted(turned));
      }
    },
  );

  it('gives four distinct cells inside the bounding box for every kind and rotation', () => {
    for (const kind of PIECE_KINDS) {
      const size = kind === 'I' ? 4 : 3;
      for (const r of ROTATIONS) {
        const found = shape(kind, r);
        expect(new Set(sorted(found)).size).toBe(4);
        for (const c of found) {
          expect(c.x).toBeGreaterThanOrEqual(0);
          expect(c.x).toBeLessThan(size);
          expect(c.y).toBeGreaterThanOrEqual(0);
          expect(c.y).toBeLessThan(size);
        }
      }
    }
  });
});

// Guideline wall-kick tests with y upward, written out in full so a typo in the table fails here.
const JLSTZ: readonly (readonly [Rotation, Rotation, Offset[]])[] = [
  [0, 1, cells([0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2])],
  [1, 0, cells([0, 0], [1, 0], [1, -1], [0, 2], [1, 2])],
  [1, 2, cells([0, 0], [1, 0], [1, -1], [0, 2], [1, 2])],
  [2, 1, cells([0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2])],
  [2, 3, cells([0, 0], [1, 0], [1, 1], [0, -2], [1, -2])],
  [3, 2, cells([0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2])],
  [3, 0, cells([0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2])],
  [0, 3, cells([0, 0], [1, 0], [1, 1], [0, -2], [1, -2])],
];

const I_TABLE: readonly (readonly [Rotation, Rotation, Offset[]])[] = [
  [0, 1, cells([0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2])],
  [1, 0, cells([0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2])],
  [1, 2, cells([0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1])],
  [2, 1, cells([0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1])],
  [2, 3, cells([0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2])],
  [3, 2, cells([0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2])],
  [3, 0, cells([0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1])],
  [0, 3, cells([0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1])],
];

describe('Srs.kicks', () => {
  it.each(JLSTZ)('gives the JLSTZ tests for %i -> %i', (from, to, expected) => {
    for (const kind of ['T', 'S', 'Z', 'J', 'L'] as const) {
      expect(kicks(kind, from, to)).toEqual(expected);
    }
  });

  it.each(I_TABLE)('gives the I tests for %i -> %i', (from, to, expected) => {
    expect(kicks('I', from, to)).toEqual(expected);
  });

  it('never kicks O', () => {
    expect(kicks('O', 0, 1)).toEqual([{ x: 0, y: 0 }]);
    expect(kicks('O', 0, 3)).toEqual([{ x: 0, y: 0 }]);
  });

  it.each([
    [0, 2],
    [1, 3],
    [2, 2],
  ] as const)('rejects %i -> %i, which is not a quarter turn', (from, to) => {
    expect(() => kicks('T', from, to)).toThrow(RangeError);
  });
});
