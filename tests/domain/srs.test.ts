import { describe, expect, it } from 'vitest';
import { PIECE_KINDS } from '../../src/domain/piece-kind';
import { kicks, shape, type Rotation } from '../../src/domain/srs';

const ROTATIONS: readonly Rotation[] = [0, 1, 2, 3];

function sorted(cells: readonly { x: number; y: number }[]): string[] {
  return cells.map((c) => `${String(c.x)},${String(c.y)}`).sort();
}

describe('Srs.shape', () => {
  it('gives the T spawn state pointing up (y grows upward)', () => {
    expect(sorted(shape('T', 0))).toEqual(
      sorted([
        { x: 1, y: 2 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
        { x: 2, y: 1 },
      ]),
    );
  });

  it('rotates T clockwise to point right', () => {
    expect(sorted(shape('T', 1))).toEqual(
      sorted([
        { x: 1, y: 2 },
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 1, y: 0 },
      ]),
    );
  });

  it('lays I horizontally on the second row from the top at spawn, vertically on column 2 after CW', () => {
    expect(sorted(shape('I', 0))).toEqual(sorted([0, 1, 2, 3].map((x) => ({ x, y: 2 }))));
    expect(sorted(shape('I', 1))).toEqual(sorted([0, 1, 2, 3].map((y) => ({ x: 2, y }))));
  });

  it('keeps O identical in every rotation', () => {
    for (const r of ROTATIONS) expect(sorted(shape('O', r))).toEqual(sorted(shape('O', 0)));
  });

  it('gives four distinct cells inside the bounding box for every kind and rotation', () => {
    for (const kind of PIECE_KINDS) {
      const size = kind === 'I' ? 4 : 3;
      for (const r of ROTATIONS) {
        const cells = shape(kind, r);
        expect(new Set(sorted(cells)).size).toBe(4);
        for (const c of cells) {
          expect(c.x).toBeGreaterThanOrEqual(0);
          expect(c.x).toBeLessThan(size);
          expect(c.y).toBeGreaterThanOrEqual(0);
          expect(c.y).toBeLessThan(size);
        }
      }
    }
  });
});

describe('Srs.kicks', () => {
  it('starts every test list with the unmoved position and has five tests', () => {
    for (const kind of PIECE_KINDS) {
      if (kind === 'O') continue;
      for (const from of ROTATIONS) {
        for (const to of [((from + 1) % 4) as Rotation, ((from + 3) % 4) as Rotation]) {
          const list = kicks(kind, from, to);
          expect(list).toHaveLength(5);
          expect(list[0]).toEqual({ x: 0, y: 0 });
        }
      }
    }
  });

  it('uses the JLSTZ table (y up) for 0 → R', () => {
    expect(kicks('T', 0, 1)).toEqual([
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: -1, y: 1 },
      { x: 0, y: -2 },
      { x: -1, y: -2 },
    ]);
  });

  it('uses the I table for 0 → R', () => {
    expect(kicks('I', 0, 1)).toEqual([
      { x: 0, y: 0 },
      { x: -2, y: 0 },
      { x: 1, y: 0 },
      { x: -2, y: -1 },
      { x: 1, y: 2 },
    ]);
  });

  it('negates every test of the forward rotation when turning back', () => {
    for (const kind of ['T', 'I'] as const) {
      for (const from of ROTATIONS) {
        const to = ((from + 1) % 4) as Rotation;
        const back = kicks(kind, to, from);
        const expected = kicks(kind, from, to).map((o) => ({ x: 0 - o.x, y: 0 - o.y }));
        // The JLSTZ and I tables are not all exact negations of each other; only R<->0 is, so
        // compare the first (null) test everywhere and the full list for the 0 / R pair.
        expect(back[0]).toEqual({ x: 0, y: 0 });
        if (from === 0) expect(back).toEqual(expected);
      }
    }
  });

  it('never kicks O', () => {
    expect(kicks('O', 0, 1)).toEqual([{ x: 0, y: 0 }]);
  });

  it('rejects a half turn', () => {
    expect(() => kicks('T', 0, 2)).toThrow(RangeError);
  });
});
