import type { SpinKind } from './spin-kind';

const LINE_POINTS: readonly number[] = [0, 100, 300, 500, 800];
const MINI_POINTS: readonly number[] = [100, 200, 400];
const SPIN_POINTS: readonly number[] = [400, 800, 1200, 1600];
const COMBO_POINTS = 50;
const LINES_PER_LEVEL = 10;

/** Level, lines, points, combo and back-to-back, as defined by GDD §4 (UML 02-class). */
export class Scoring {
  private readonly startLevel: number;
  private totalLines = 0;
  private totalPoints = 0;
  // Consecutive locks that cleared lines: the bonus is 0 on the 2nd, 50 on the 3rd, 100 on the 4th…
  private combo = 0;
  private backToBack = false;

  constructor(startLevel: number) {
    this.startLevel = startLevel;
  }

  /** Total lines cleared; it drives the level. */
  get lines(): number {
    return this.totalLines;
  }

  /** Running score. */
  get points(): number {
    return this.totalPoints;
  }

  /** Current level: the start level plus one per 10 lines. */
  get level(): number {
    return this.startLevel + Math.floor(this.lines / LINES_PER_LEVEL);
  }

  /**
   * Scores a lock that cleared `rows` lines (0 allowed) with the given T-spin result. Updates
   * lines, points, combo and back-to-back; points use the level held before this clear's own
   * level-up (GDD §4).
   */
  award(rows: number, spin: SpinKind): void {
    const level = this.level;
    let base = basePoints(rows, spin);
    if (rows === 0) {
      this.combo = 0;
    } else {
      const difficult = rows === 4 || spin !== 'None';
      // Back-to-back ×1.5 (GDD §4); every base is a multiple of 100, so the result is an integer.
      if (difficult && this.backToBack) base = (base * 3) / 2;
      this.backToBack = difficult;
      this.combo += 1;
      base += COMBO_POINTS * Math.max(this.combo - 2, 0);
      this.totalLines += rows;
    }
    this.totalPoints += base * level;
  }

  /** Soft drop: 1 point per cell, never multiplied by the level. */
  addSoftDrop(cells: number): void {
    this.totalPoints += cells;
  }

  /** Hard drop: 2 points per cell, never multiplied by the level. */
  addHardDrop(cells: number): void {
    this.totalPoints += cells * 2;
  }
}

function basePoints(rows: number, spin: SpinKind): number {
  if (spin === 'None') return LINE_POINTS[rows] ?? 0;
  // A Mini cannot clear 3+ rows; if it ever does, it scores as a full T-spin.
  if (spin === 'Mini' && rows < MINI_POINTS.length) return MINI_POINTS[rows] ?? 0;
  return SPIN_POINTS[rows] ?? 0;
}
