import { describe, expect, it } from 'vitest';
import { MAX_GRAVITY_LEVEL, SUB_CELLS_PER_CELL, subCellsPerStep } from '../../src/domain/gravity';

describe('Gravity', () => {
  it('uses 256 sub-cells per cell', () => {
    expect(SUB_CELLS_PER_CELL).toBe(256);
  });

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

  it('returns integers only', () => {
    for (let level = 1; level <= MAX_GRAVITY_LEVEL; level += 1) {
      expect(Number.isInteger(subCellsPerStep(level))).toBe(true);
    }
  });
});
