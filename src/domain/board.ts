import type { ActivePiece } from './active-piece';
import { BOARD_HEIGHT, BOARD_WIDTH, VISIBLE_ROWS } from './board-size';
import { PIECE_KINDS } from './piece-kind';
import { shape } from './srs';

/** The 10 × 40 playfield; `y` runs bottom to top and rows 20+ are the spawn buffer (UML 02-class). */
export class Board {
  private readonly cells = new Uint8Array(BOARD_WIDTH * BOARD_HEIGHT);
  private readonly fullRows: number[] = [];

  /** True when `(x, y)` holds a locked cell; everything outside the board counts as occupied. */
  isOccupied(x: number, y: number): boolean {
    if (x < 0 || x >= BOARD_WIDTH || y < 0 || y >= BOARD_HEIGHT) return true;
    return this.cells[y * BOARD_WIDTH + x] !== 0;
  }

  /** The locked cell's code: 0 for empty or outside the board, else the piece kind's index + 1 (`PIECE_KINDS`). */
  cellAt(x: number, y: number): number {
    if (x < 0 || x >= BOARD_WIDTH || y < 0 || y >= BOARD_HEIGHT) return 0;
    return this.cells[y * BOARD_WIDTH + x] ?? 0;
  }

  /** True when every cell of the piece is inside the board and free. */
  fits(piece: ActivePiece): boolean {
    return this.fitsAt(piece, piece.y);
  }

  /** How many rows the piece can fall before touching the stack or the floor; 0 if it already collides. */
  dropDistance(piece: ActivePiece): number {
    let distance = 0;
    while (this.fitsAt(piece, piece.y - distance - 1)) distance += 1;
    return distance;
  }

  /**
   * Writes the piece into the board and returns the completed rows, ascending; they stay in place
   * so the renderer can flash them (see `clearRows`). The array is reused: it is valid until the
   * next `lock`.
   * @throws RangeError when the piece does not fit.
   */
  lock(piece: ActivePiece): readonly number[] {
    if (!this.fits(piece)) throw new RangeError('Board.lock: the piece does not fit');
    const code = PIECE_KINDS.indexOf(piece.kind) + 1;
    const s = shape(piece.kind, piece.rotation);
    this.cells[(piece.y + s[0].y) * BOARD_WIDTH + piece.x + s[0].x] = code;
    this.cells[(piece.y + s[1].y) * BOARD_WIDTH + piece.x + s[1].x] = code;
    this.cells[(piece.y + s[2].y) * BOARD_WIDTH + piece.x + s[2].x] = code;
    this.cells[(piece.y + s[3].y) * BOARD_WIDTH + piece.x + s[3].x] = code;
    // Only the four rows the box covers can have become full.
    this.fullRows.length = 0;
    const top = Math.min(piece.y + 4, BOARD_HEIGHT);
    for (let y = Math.max(piece.y, 0); y < top; y += 1) {
      if (this.isRowFull(y)) this.fullRows.push(y);
    }
    return this.fullRows;
  }

  /** Removes the given rows (ascending, unique, as `lock` returns them) in one pass and drops the rows above. */
  clearRows(rows: readonly number[]): void {
    let target = 0;
    let next = 0;
    for (let source = 0; source < BOARD_HEIGHT; source += 1) {
      if (next < rows.length && rows[next] === source) {
        next += 1;
        continue;
      }
      if (target !== source) {
        this.cells.copyWithin(
          target * BOARD_WIDTH,
          source * BOARD_WIDTH,
          (source + 1) * BOARD_WIDTH,
        );
      }
      target += 1;
    }
    this.cells.fill(0, target * BOARD_WIDTH);
  }

  /** Lock out: every cell of the piece is on a buffer row (y ≥ 20). */
  isLockOut(piece: ActivePiece): boolean {
    const s = shape(piece.kind, piece.rotation);
    return (
      piece.y + s[0].y >= VISIBLE_ROWS &&
      piece.y + s[1].y >= VISIBLE_ROWS &&
      piece.y + s[2].y >= VISIBLE_ROWS &&
      piece.y + s[3].y >= VISIBLE_ROWS
    );
  }

  // Indexed 0..3 rather than destructured or looped: no iterator, no allocation, no index guards.
  private fitsAt(piece: ActivePiece, y: number): boolean {
    const s = shape(piece.kind, piece.rotation);
    return (
      !this.isOccupied(piece.x + s[0].x, y + s[0].y) &&
      !this.isOccupied(piece.x + s[1].x, y + s[1].y) &&
      !this.isOccupied(piece.x + s[2].x, y + s[2].y) &&
      !this.isOccupied(piece.x + s[3].x, y + s[3].y)
    );
  }

  private isRowFull(y: number): boolean {
    for (let x = 0; x < BOARD_WIDTH; x += 1) {
      if (this.cells[y * BOARD_WIDTH + x] === 0) return false;
    }
    return true;
  }
}
