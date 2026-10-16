import type { ActivePiece } from './active-piece';
import { BOARD_HEIGHT, BOARD_WIDTH, VISIBLE_ROWS } from './board-size';
import { PIECE_KINDS } from './piece-kind';
import { shape } from './srs';

/** The 10 × 40 playfield; `y` runs bottom to top and rows 20+ are the spawn buffer (UML 02-class). */
export class Board {
  private readonly cells = new Uint8Array(BOARD_WIDTH * BOARD_HEIGHT);

  /** True when `(x, y)` holds a locked cell; everything outside the board counts as occupied. */
  isOccupied(x: number, y: number): boolean {
    if (x < 0 || x >= BOARD_WIDTH || y < 0 || y >= BOARD_HEIGHT) return true;
    return this.cells[y * BOARD_WIDTH + x] !== 0;
  }

  /** True when every cell of the piece is inside the board and free. */
  fits(piece: ActivePiece): boolean {
    const [a, b, c, d] = shape(piece.kind, piece.rotation);
    return (
      !this.isOccupied(piece.x + a.x, piece.y + a.y) &&
      !this.isOccupied(piece.x + b.x, piece.y + b.y) &&
      !this.isOccupied(piece.x + c.x, piece.y + c.y) &&
      !this.isOccupied(piece.x + d.x, piece.y + d.y)
    );
  }

  /** How many rows the piece can fall before touching the stack or the floor. */
  dropDistance(piece: ActivePiece): number {
    let distance = 0;
    while (this.fits({ ...piece, y: piece.y - distance - 1 })) distance += 1;
    return distance;
  }

  /** Writes the piece into the board and returns the completed rows, ascending; they stay in place. */
  lock(piece: ActivePiece): number[] {
    const code = PIECE_KINDS.indexOf(piece.kind) + 1;
    const [a, b, c, d] = shape(piece.kind, piece.rotation);
    this.cells[(piece.y + a.y) * BOARD_WIDTH + piece.x + a.x] = code;
    this.cells[(piece.y + b.y) * BOARD_WIDTH + piece.x + b.x] = code;
    this.cells[(piece.y + c.y) * BOARD_WIDTH + piece.x + c.x] = code;
    this.cells[(piece.y + d.y) * BOARD_WIDTH + piece.x + d.x] = code;
    const full: number[] = [];
    for (let y = 0; y < BOARD_HEIGHT; y += 1) {
      if (this.isRowFull(y)) full.push(y);
    }
    return full;
  }

  /** Removes the given rows (ascending) and drops the rows above them. */
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
    const [a, b, c, d] = shape(piece.kind, piece.rotation);
    return (
      piece.y + a.y >= VISIBLE_ROWS &&
      piece.y + b.y >= VISIBLE_ROWS &&
      piece.y + c.y >= VISIBLE_ROWS &&
      piece.y + d.y >= VISIBLE_ROWS
    );
  }

  private isRowFull(y: number): boolean {
    for (let x = 0; x < BOARD_WIDTH; x += 1) {
      if (this.cells[y * BOARD_WIDTH + x] === 0) return false;
    }
    return true;
  }
}
