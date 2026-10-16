import type { Prng } from '../ports/prng';

const TWO_POW_32 = 2 ** 32;
const GOLDEN_RATIO_STEP = 0x9e3779b9;

/**
 * Deterministic gameplay randomness (ADR-0002): xoshiro128** by Blackman and Vigna, 32-bit integer
 * state, copied from retro-shmup `SeededRandom` (source SHA f698786). Seeding uses a SplitMix-style
 * 32-bit mixer (golden-ratio Weyl step + MurmurHash3 fmix32), so any seed, 0 included, gives a
 * well-mixed, never all-zero state. No allocation after construction.
 */
export class SeededPrng implements Prng {
  private s0: number;
  private s1: number;
  private s2: number;
  private s3: number;

  constructor(seed: number) {
    // ECMAScript ToUint32: -1 and 2³² − 1 give the same sequence.
    const m0 = ((seed >>> 0) + GOLDEN_RATIO_STEP) >>> 0;
    const m1 = (m0 + GOLDEN_RATIO_STEP) >>> 0;
    const m2 = (m1 + GOLDEN_RATIO_STEP) >>> 0;
    const m3 = (m2 + GOLDEN_RATIO_STEP) >>> 0;
    this.s0 = fmix32(m0);
    this.s1 = fmix32(m1);
    this.s2 = fmix32(m2);
    this.s3 = fmix32(m3);
  }

  /** Returns an integer in [0, max). */
  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }

  private next(): number {
    const { s0, s1, s2, s3 } = this;
    const result = Math.imul(rotl(Math.imul(s1, 5), 7), 9) >>> 0;
    const t = (s1 << 9) >>> 0;
    const n2 = (s2 ^ s0) >>> 0;
    const n3 = (s3 ^ s1) >>> 0;
    this.s1 = (s1 ^ n2) >>> 0;
    this.s0 = (s0 ^ n3) >>> 0;
    this.s2 = (n2 ^ t) >>> 0;
    this.s3 = rotl(n3, 11);
    return result / TWO_POW_32;
  }
}

/** MurmurHash3 32-bit finalizer. */
function fmix32(value: number): number {
  let z = Math.imul(value ^ (value >>> 16), 0x85ebca6b);
  z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35);
  return (z ^ (z >>> 16)) >>> 0;
}

function rotl(x: number, k: number): number {
  return ((x << k) | (x >>> (32 - k))) >>> 0;
}
