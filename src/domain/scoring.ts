import type { SpinKind } from './spin-kind';

const LINE_POINTS: readonly number[] = [0, 100, 300, 500, 800];
const MINI_POINTS: readonly number[] = [100, 200, 400];
const SPIN_POINTS: readonly number[] = [400, 800, 1200, 1600];
const COMBO_POINTS = 50;
const LINES_PER_LEVEL = 10;

/** Level, lines, points, combo and back-to-back, as defined by GDD §4 (UML 02-class). */
export class Scoring {
  lines = 0;
  points = 0;
  private readonly startLevel: number;
  // Consecutive locks that cleared lines: the combo bonus starts at 0 on the second one.
  private combo = 0;
  private backToBack = false;

  constructor(startLevel: number) {
    this.startLevel = startLevel;
  }

  /** Current level: the start level plus one per 10 lines. */
  get level(): number {
    return this.startLevel + Math.floor(this.lines / LINES_PER_LEVEL);
  }

  /** Scores a lock that cleared `rows` lines (0 allowed) with the given T-spin result. */
  award(rows: number, spin: SpinKind): void {
    const level = this.level;
    let base = basePoints(rows, spin);
    if (rows === 0) {
      this.combo = 0;
    } else {
      const difficult = rows === 4 || spin !== 'None';
      if (difficult && this.backToBack) base = (base * 3) / 2;
      this.backToBack = difficult;
      this.combo += 1;
      base += COMBO_POINTS * Math.max(this.combo - 2, 0);
      this.lines += rows;
    }
    this.points += base * level;
  }

  /** Adds drop points: 1 per cell for a soft drop, 2 for a hard drop, never multiplied by the level. */
  addDrop(cells: number, hard: boolean): void {
    this.points += cells * (hard ? 2 : 1);
  }
}

function basePoints(rows: number, spin: SpinKind): number {
  if (spin === 'None') return LINE_POINTS[rows] ?? 0;
  if (spin === 'Mini' && rows < SPIN_POINTS.length - 1) return MINI_POINTS[rows] ?? 0;
  return SPIN_POINTS[rows] ?? 0;
}
