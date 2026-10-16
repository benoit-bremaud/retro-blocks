import { describe, expect, it } from 'vitest';
import { spawnPiece } from '../../src/domain/active-piece';
import { Board } from '../../src/domain/board';
import { PIECE_KINDS } from '../../src/domain/piece-kind';
import { shape } from '../../src/domain/srs';

describe('spawnPiece', () => {
  it.each(PIECE_KINDS)('places %s in rows 20-21, centred, and fitting an empty board', (kind) => {
    const piece = spawnPiece(kind);
    expect(piece.kind).toBe(kind);
    expect(piece.rotation).toBe(0);
    const cells = shape(kind, 0).map((c) => ({ x: piece.x + c.x, y: piece.y + c.y }));
    for (const cell of cells) {
      expect(cell.y).toBeGreaterThanOrEqual(20);
      expect(cell.y).toBeLessThanOrEqual(21);
    }
    // Centred on the 10-wide board: 3-wide pieces span columns 3-5, I spans 3-6, O spans 4-5.
    const xs = cells.map((c) => c.x);
    expect(Math.min(...xs) + Math.max(...xs)).toBe(kind === 'I' || kind === 'O' ? 9 : 8);
    expect(new Board().fits(piece)).toBe(true);
  });
});
