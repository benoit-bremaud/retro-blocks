import { PIECE_KINDS, type PieceKind } from './piece-kind';
import type { Prng } from './ports/prng';

const BAG_SIZE = PIECE_KINDS.length;

/** 7-bag randomizer: every kind once per bag, shuffled by the injected seeded `Prng` (GDD §3). */
export class Bag7 {
  private readonly rng: Prng;
  private readonly queue: PieceKind[] = [];
  private readonly window: PieceKind[] = [];

  constructor(rng: Prng) {
    this.rng = rng;
  }

  /** Removes and returns the next piece. */
  next(): PieceKind {
    this.fill(1);
    const kind = this.queue.shift();
    if (kind === undefined) throw new Error('Bag7: empty queue after refill');
    return kind;
  }

  /**
   * The next `count` pieces without consuming them; a new bag is drawn only when the queue runs
   * short. The array is reused: it is valid until the next `preview`.
   */
  preview(count: number): readonly PieceKind[] {
    this.fill(count);
    this.window.length = 0;
    for (let i = 0; i < count; i += 1) {
      const kind = this.queue[i];
      if (kind !== undefined) this.window.push(kind);
    }
    return this.window;
  }

  private fill(count: number): void {
    while (this.queue.length < count) {
      const start = this.queue.length;
      this.queue.push(...PIECE_KINDS);
      // In-place Fisher–Yates on the new bag: uniform, and no temporary array.
      for (let i = BAG_SIZE - 1; i > 0; i -= 1) {
        swap(this.queue, start + i, start + this.rng.nextInt(i + 1));
      }
    }
  }
}

function swap(items: PieceKind[], i: number, j: number): void {
  const a = items[i];
  const b = items[j];
  if (a === undefined || b === undefined) return;
  items[i] = b;
  items[j] = a;
}
