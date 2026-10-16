import { describe, expect, it } from 'vitest';
import { Bag7 } from '../../src/domain/bag7';
import { PIECE_KINDS, type PieceKind } from '../../src/domain/piece-kind';
import type { Prng } from '../../src/domain/ports/prng';
import { SeededPrng } from '../../src/domain/random/seeded-prng';

/** Always picks the last index, so the shuffle swaps nothing and each bag keeps `PIECE_KINDS` order. */
function identityPrng(): Prng & { calls: number; maxes: number[] } {
  const prng = {
    calls: 0,
    maxes: [] as number[],
    nextInt(max: number): number {
      prng.calls += 1;
      prng.maxes.push(max);
      return max - 1;
    },
  };
  return prng;
}

function take(bag: Bag7, count: number): PieceKind[] {
  const out: PieceKind[] = [];
  for (let i = 0; i < count; i += 1) out.push(bag.next());
  return out;
}

describe('Bag7', () => {
  it('shuffles each bag in place with a shrinking range', () => {
    const prng = identityPrng();
    new Bag7(prng).next();
    expect(prng.maxes).toEqual([7, 6, 5, 4, 3, 2]);
  });

  it('follows the generator: always picking index 0 moves each kind to the front in turn', () => {
    const bag = new Bag7({ nextInt: () => 0 });
    expect(take(bag, 7)).toEqual(['O', 'T', 'S', 'Z', 'J', 'L', 'I']);
  });

  it('deals each bag in the order the shuffle produced', () => {
    const bag = new Bag7(identityPrng());
    expect(take(bag, 14)).toEqual([...PIECE_KINDS, ...PIECE_KINDS]);
  });

  it('deals every kind exactly once per consecutive bag with a real generator', () => {
    const bag = new Bag7(new SeededPrng(2026));
    for (let i = 0; i < 20; i += 1) {
      expect([...take(bag, 7)].sort()).toEqual([...PIECE_KINDS].sort());
    }
  });

  it('is deterministic for a given seed', () => {
    expect(take(new Bag7(new SeededPrng(5)), 30)).toEqual(take(new Bag7(new SeededPrng(5)), 30));
  });

  it('previews the next pieces without consuming them', () => {
    const bag = new Bag7(identityPrng());
    expect(bag.preview(5)).toEqual(PIECE_KINDS.slice(0, 5));
    expect(bag.preview(5)).toEqual(PIECE_KINDS.slice(0, 5));
    expect(bag.next()).toBe(PIECE_KINDS[0]);
  });

  it('refills across bags when the preview is longer than the queue', () => {
    const bag = new Bag7(identityPrng());
    take(bag, 5);
    expect(bag.preview(5)).toEqual([PIECE_KINDS[5], PIECE_KINDS[6], ...PIECE_KINDS.slice(0, 3)]);
    expect(take(bag, 7)).toEqual([PIECE_KINDS[5], PIECE_KINDS[6], ...PIECE_KINDS.slice(0, 5)]);
  });

  it('draws a new bag only when the queue runs short', () => {
    const prng = identityPrng();
    const bag = new Bag7(prng);
    bag.preview(5);
    expect(prng.calls).toBe(6);
    bag.preview(7);
    expect(prng.calls).toBe(6);
    bag.preview(8);
    expect(prng.calls).toBe(12);
  });
});
