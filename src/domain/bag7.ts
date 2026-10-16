import { PIECE_KINDS, type PieceKind } from './piece-kind';
import type { Prng } from './ports/prng';

/** 7-bag randomizer: every kind once per bag, shuffled by the injected seeded `Prng` (GDD §3). */
export class Bag7 {
  private readonly queue: PieceKind[] = [];

  private readonly rng: Prng;

  constructor(rng: Prng) {
    this.rng = rng;
  }

  /** Removes and returns the next piece. */
  next(): PieceKind {
    this.fill(1);
    // fill(1) guarantees a piece; the fallback only satisfies the index type.
    return this.queue.shift() ?? PIECE_KINDS[0];
  }

  /** The next `count` pieces without consuming them; a new bag is drawn only when the queue runs short. */
  preview(count: number): PieceKind[] {
    this.fill(count);
    return this.queue.slice(0, count);
  }

  private fill(count: number): void {
    while (this.queue.length < count) {
      // Draw without replacement: a uniform shuffle of the seven kinds.
      const pool: PieceKind[] = [...PIECE_KINDS];
      while (pool.length > 0) {
        this.queue.push(...pool.splice(this.rng.nextInt(pool.length), 1));
      }
    }
  }
}
