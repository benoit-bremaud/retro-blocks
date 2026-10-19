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

function row(board: Board, y: number): number[] {
  const xs: number[] = [];
  for (let x = 0; x < BOARD_WIDTH; x += 1) if (board.isOccupied(x, y)) xs.push(x);
  return xs;
}

const ALL = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

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

  it('reports the locked cell code, and 0 for empty or outside cells', () => {
    const board = new Board();
    board.lock(piece('T', 0, 0));
    // T is the third kind: code 3. Rotation 0 holds (1, 2) and (0..2, 1).
    expect(board.cellAt(1, 2)).toBe(3);
    expect(board.cellAt(0, 1)).toBe(3);
    expect(board.cellAt(5, 5)).toBe(0);
    expect(board.cellAt(-1, 0)).toBe(0);
    expect(board.cellAt(BOARD_WIDTH, 0)).toBe(0);
    expect(board.cellAt(0, -1)).toBe(0);
    expect(board.cellAt(0, BOARD_HEIGHT)).toBe(0);
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

    it('stops on an overhang rather than the lowest column', () => {
      const board = new Board();
      board.lock(piece('I', 3, -2)); // row 0, columns 3..6
      // T rotation 0: stem at (x + 1, y + 2), arms at (x..x + 2, y + 1); stem over column 4.
      expect(board.dropDistance(piece('T', 3, 10))).toBe(10);
    });

    it('is 0 for a grounded piece', () => {
      expect(new Board().dropDistance(piece('O', 3, -1))).toBe(0);
    });
  });

  describe('lock', () => {
    it('refuses a piece that does not fit', () => {
      const board = new Board();
      expect(() => board.lock(piece('T', -1, 5))).toThrow(RangeError);
      board.lock(piece('O', 4, 0));
      expect(() => board.lock(piece('O', 4, 0))).toThrow(RangeError);
    });

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
    it('does nothing for an empty list', () => {
      const board = new Board();
      fillRow(board, 0);
      board.clearRows([]);
      expect(row(board, 0)).toEqual(ALL);
    });

    it('removes the row and drops everything above', () => {
      const board = new Board();
      fillRow(board, 0);
      board.lock(piece('O', 0, 1)); // marker at (1..2, 2..3)
      board.clearRows([0]);
      expect(row(board, 0)).toEqual([8, 9]); // was row 1
      expect(row(board, 1)).toEqual([1, 2]);
      expect(row(board, 2)).toEqual([1, 2]);
      expect(row(board, 3)).toEqual([]);
    });

    it('removes several non-adjacent rows at once', () => {
      const board = new Board();
      fillRow(board, 0);
      fillRow(board, 2);
      board.clearRows([0, 2]);
      expect(row(board, 0)).toEqual([8, 9]);
      expect(row(board, 1)).toEqual([8, 9]);
      expect(row(board, 2)).toEqual([]);
    });

    it('removes adjacent rows and zeroes the vacated top', () => {
      const board = new Board();
      board.lock(piece('I', 0, -2));
      board.lock(piece('I', 0, -1));
      board.lock(piece('O', 7, -1));
      board.lock(piece('O', 3, -1));
      board.lock(piece('O', 5, -1));
      board.lock(piece('O', 3, 36)); // marker on rows 37..38
      board.clearRows([0, 1]);
      expect(row(board, 0)).toEqual([]);
      expect(row(board, 35)).toEqual([4, 5]);
      expect(row(board, 36)).toEqual([4, 5]);
      expect(row(board, 37)).toEqual([]);
      expect(row(board, 39)).toEqual([]);
    });

    it('removes the top row', () => {
      const board = new Board();
      board.lock(piece('O', 3, 37)); // rows 38..39
      board.clearRows([39]);
      expect(row(board, 38)).toEqual([4, 5]);
      expect(row(board, 39)).toEqual([]);
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
