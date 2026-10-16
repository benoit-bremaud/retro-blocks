import { describe, expect, it } from 'vitest';
import { SeededPrng } from '../../../src/domain/random/seeded-prng';

function draw(seed: number, count: number, max: number): number[] {
  const rng = new SeededPrng(seed);
  const out: number[] = [];
  for (let i = 0; i < count; i += 1) out.push(rng.nextInt(max));
  return out;
}

describe('SeededPrng', () => {
  it('matches the retro-shmup xoshiro128** sequence (golden vector, ADR-0002)', () => {
    expect(draw(42, 8, 1000)).toEqual([660, 126, 111, 814, 79, 26, 15, 258]);
  });

  it('replays the same sequence for the same seed', () => {
    expect(draw(42, 50, 1000)).toEqual(draw(42, 50, 1000));
  });

  it('gives a different sequence for a different seed', () => {
    expect(draw(1, 20, 1000)).not.toEqual(draw(2, 20, 1000));
  });

  it('stays within [0, max) and reaches every value', () => {
    const values = draw(7, 2000, 7);
    expect(Math.min(...values)).toBe(0);
    expect(Math.max(...values)).toBe(6);
    expect(new Set(values).size).toBe(7);
    expect(values.every(Number.isInteger)).toBe(true);
  });

  it('mixes seed 0 into a usable state, distinct from seed 1', () => {
    expect(new Set(draw(0, 20, 1000)).size).toBeGreaterThan(1);
    expect(draw(0, 20, 1000)).not.toEqual(draw(1, 20, 1000));
  });

  it('returns 0 when max is 1', () => {
    expect(draw(3, 10, 1)).toEqual(new Array<number>(10).fill(0));
  });

  it('reduces seeds to 32 bits', () => {
    expect(draw(-1, 10, 1000)).toEqual(draw(2 ** 32 - 1, 10, 1000));
  });
});
