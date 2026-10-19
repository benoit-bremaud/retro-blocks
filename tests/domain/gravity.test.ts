import { describe, expect, it } from 'vitest';
import { MAX_GRAVITY_LEVEL, SUB_CELLS_PER_CELL, subCellsPerStep } from '../../src/domain/gravity';

describe('Gravity', () => {
  it('level 1 is one cell per second (Guideline)', () => {
    expect(subCellsPerStep(1)).toBe(4);
  });

  it('is strictly increasing up to the cap', () => {
    for (let level = 2; level <= MAX_GRAVITY_LEVEL; level += 1) {
      expect(subCellsPerStep(level)).toBeGreaterThan(subCellsPerStep(level - 1));
    }
  });

  it('exceeds one cell per step at the cap', () => {
    expect(subCellsPerStep(MAX_GRAVITY_LEVEL)).toBeGreaterThan(SUB_CELLS_PER_CELL);
  });

  it('holds the cap value beyond level 15', () => {
    expect(subCellsPerStep(16)).toBe(subCellsPerStep(MAX_GRAVITY_LEVEL));
    expect(subCellsPerStep(99)).toBe(subCellsPerStep(MAX_GRAVITY_LEVEL));
  });

  it('treats a level below 1 as level 1', () => {
    expect(subCellsPerStep(0)).toBe(subCellsPerStep(1));
  });

  it.each([
    [5, 12],
    [8, 32],
    [10, 67],
    [15, 604],
  ])('level %i falls %i sub-cells per step (Guideline curve)', (level, expected) => {
    expect(subCellsPerStep(level)).toBe(expected);
  });
});
