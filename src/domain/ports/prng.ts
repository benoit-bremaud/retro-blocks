/**
 * Seeded pseudo-random source for gameplay only (ADR-0002). Presentation uses its own unseeded
 * generator, so a replay depends on this one alone.
 */
export interface Prng {
  /** Returns an integer in [0, max). */
  nextInt(max: number): number;
}
