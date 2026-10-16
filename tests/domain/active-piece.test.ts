import { describe, expect, it } from 'vitest';
import { spawnPiece } from '../../src/domain/active-piece';
import { Board } from '../../src/domain/board';
import { PIECE_KINDS, type PieceKind } from '../../src/domain/piece-kind';
import { shape } from '../../src/domain/srs';

const COLUMNS: Readonly<Record<PieceKind, readonly [number, number]>> = {
  I: [3, 6],
  O: [4, 5],
  T: [3, 5],
  S: [3, 5],
  Z: [3, 5],
  J: [3, 5],
  L: [3, 5],
};

describe('spawnPiece', () => {
  it.each(PIECE_KINDS)('places %s on rows 20-21, centred, and fitting an empty board', (kind) => {
    const piece = spawnPiece(kind);
    expect(piece.kind).toBe(kind);
    expect(piece.rotation).toBe(0);
    const cells = shape(kind, 0).map((c) => ({ x: piece.x + c.x, y: piece.y + c.y }));
    const rows = cells.map((c) => c.y);
    const columns = cells.map((c) => c.x);
    expect(Math.min(...rows)).toBeGreaterThanOrEqual(20);
    expect(Math.max(...rows)).toBeLessThanOrEqual(21);
    expect([Math.min(...columns), Math.max(...columns)]).toEqual(COLUMNS[kind]);
    expect(new Board().fits(piece)).toBe(true);
  });
});
