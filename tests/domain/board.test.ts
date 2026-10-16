import { describe, expect, it } from 'vitest';
import type { ActivePiece } from '../../src/domain/active-piece';
import { Board } from '../../src/domain/board';
import { BOARD_HEIGHT, BOARD_WIDTH } from '../../src/domain/board-size';

// Geometry used below (y grows upward, `x`/`y` are the box's bottom-left corner):
//   I rotation 0 -> cells (x..x+3, y+2)       O -> cells (x+1..x+2, y+1..y+2)
//   T rotation 0 -> cells (x+1, y+2), (x..x+2, y+1)
function piece(kind: ActivePiece['kind'], x: number, y: number): ActivePiece {
  return { kind, rotation: 0, x, y };
}

/** Completes row `y`; the closing O also leaves two cells at (8..9, y + 1). */
function fillRow(board: Board, y: number): void {
  board.lock(piece('I', 0, y - 2));
  board.lock(piece('I', 4, y - 2));
  board.lock(piece('O', 7, y - 1));
}

describe('Board', () => {
  it('starts empty and reports cells outside the board as occupied', () => {
    const board = new Board();
    expect(board.isOccupied(0, 0)).toBe(false);
    expect(board.isOccupied(BOARD_WIDTH - 1, BOARD_HEIGHT - 1)).toBe(false);
    expect(board.isOccupied(-1, 0)).toBe(true);
    expect(board.isOccupied(BOARD_WIDTH, 0)).toBe(true);
    expect(board.isOccupied(0, -1)).toBe(true);
    expect(board.isOccupied(0, BOARD_HEIGHT)).toBe(true);
  });

  describe('fits', () => {
    it('accepts a piece inside the board', () => {
      const board = new Board();
      expect(board.fits(piece('T', 3, 19))).toBe(true);
      expect(board.fits(piece('I', 0, -2))).toBe(true);
      expect(board.fits(piece('I', 3, BOARD_HEIGHT - 3))).toBe(true);
    });

    it.each([
      ['left wall', piece('T', -1, 5)],
      ['right wall', piece('T', 8, 5)],
      ['floor', piece('T', 3, -2)],
      ['ceiling', piece('I', 3, BOARD_HEIGHT - 2)],
    ])('rejects a piece crossing the %s', (_name, candidate) => {
      expect(new Board().fits(candidate)).toBe(false);
    });

    it('rejects an overlap with locked cells but not a neighbour', () => {
      const board = new Board();
      board.lock(piece('O', 4, 0));
      expect(board.fits(piece('O', 4, 0))).toBe(false);
      expect(board.fits(piece('O', 6, 0))).toBe(true);
    });
  });

  describe('dropDistance', () => {
    it('counts the rows down to the floor', () => {
      expect(new Board().dropDistance(piece('O', 3, 19))).toBe(20);
    });

    it('stops on the stack', () => {
      const board = new Board();
      board.lock(piece('O', 3, -1));
      expect(board.dropDistance(piece('O', 3, 19))).toBe(18);
    });

    it('is 0 for a grounded piece', () => {
      expect(new Board().dropDistance(piece('O', 3, -1))).toBe(0);
    });
  });

  describe('lock', () => {
    it('writes the cells and returns no row while rows are incomplete', () => {
      const board = new Board();
      expect(board.lock(piece('O', 3, -1))).toEqual([]);
      expect(board.isOccupied(4, 0)).toBe(true);
      expect(board.isOccupied(5, 1)).toBe(true);
      expect(board.isOccupied(6, 0)).toBe(false);
    });

    it('returns the completed rows in ascending order and leaves them in place', () => {
      const board = new Board();
      board.lock(piece('I', 0, -2));
      board.lock(piece('I', 0, -1));
      board.lock(piece('O', 7, -1));
      board.lock(piece('O', 3, -1));
      expect(board.lock(piece('O', 5, -1))).toEqual([0, 1]);
      expect(board.isOccupied(0, 0)).toBe(true);
      expect(board.isOccupied(9, 1)).toBe(true);
    });
  });

  describe('clearRows', () => {
    it('removes the row and drops everything above', () => {
      const board = new Board();
      fillRow(board, 0);
      board.lock(piece('O', 0, 1)); // marker at (1..2, 2..3)
      board.clearRows([0]);
      expect(board.isOccupied(0, 0)).toBe(false);
      expect(board.isOccupied(8, 0)).toBe(true); // was (8, 1)
      expect(board.isOccupied(1, 1)).toBe(true);
      expect(board.isOccupied(1, 3)).toBe(false);
    });

    it('removes several non-adjacent rows at once', () => {
      const board = new Board();
      fillRow(board, 0);
      fillRow(board, 2);
      board.clearRows([0, 2]);
      expect(board.isOccupied(0, 0)).toBe(false);
      expect(board.isOccupied(8, 0)).toBe(true);
      expect(board.isOccupied(8, 1)).toBe(true);
      expect(board.isOccupied(8, 2)).toBe(false);
    });
  });

  describe('isLockOut', () => {
    it('is true only when every cell is on row 20 or above', () => {
      const board = new Board();
      expect(board.isLockOut(piece('T', 3, 19))).toBe(true);
      expect(board.isLockOut(piece('I', 3, 18))).toBe(true);
      expect(board.isLockOut(piece('T', 3, 18))).toBe(false);
    });
  });
});
