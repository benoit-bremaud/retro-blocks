/** Fixed-point precision: 256 sub-cells make one cell (UML 02-class). */
export const SUB_CELLS_PER_CELL = 256;

/** Gravity stops speeding up at this level (GDD §5). */
export const MAX_GRAVITY_LEVEL = 15;

// Guideline curve, seconds per row = (0.8 − (L − 1) × 0.007)^(L − 1), as sub-cells per 60 Hz step:
// round(256 / (60 × seconds)). Precomputed integers: no floating point in the simulation.
const SUB_CELLS_BY_LEVEL: readonly number[] = [
  4, 5, 7, 9, 12, 16, 22, 32, 45, 67, 99, 151, 235, 373, 604,
];

/** Sub-cells the piece falls per step at `level`; levels below 1 count as 1, above 15 as 15. */
export function subCellsPerStep(level: number): number {
  const index = Math.min(Math.max(level, 1), MAX_GRAVITY_LEVEL) - 1;
  return SUB_CELLS_BY_LEVEL[index] ?? 0;
}
