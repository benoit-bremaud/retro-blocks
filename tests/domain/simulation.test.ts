import { describe, expect, it } from 'vitest';
import { Board } from '../../src/domain/board';
import { BOARD_WIDTH } from '../../src/domain/board-size';
import { Intent, type IntentFrame } from '../../src/domain/intent';
import type { PieceKind } from '../../src/domain/piece-kind';
import type { Prng } from '../../src/domain/ports/prng';
import { SeededPrng } from '../../src/domain/random/seeded-prng';
import { Simulation, type StepOutcome } from '../../src/domain/simulation';
import type { Rotation } from '../../src/domain/srs';

const IDLE: IntentFrame = { held: 0, pressed: 0 };

function press(flags: number): IntentFrame {
  return { held: flags, pressed: flags };
}

/** First bag in `PIECE_KINDS` order: I, O, T, S, Z, J, L. */
function identityPrng(): Prng {
  return { nextInt: (max) => max - 1 };
}

/** First bag T, O, I, S, Z, J, L (derived from the Fisher–Yates order in `Bag7`). */
function tFirstPrng(): Prng {
  const script = [6, 5, 4, 3, 0, 1];
  let index = 0;
  return {
    nextInt(max) {
      const value = script[index];
      index += 1;
      return value ?? max - 1;
    },
  };
}

/** A board where extra cells can be made solid without a piece, to set up spin corners. */
class ObstacleBoard extends Board {
  private readonly blocked = new Set<number>();

  block(...cells: readonly (readonly [number, number])[]): void {
    for (const [x, y] of cells) this.blocked.add(y * BOARD_WIDTH + x);
  }

  override isOccupied(x: number, y: number): boolean {
    return super.isOccupied(x, y) || this.blocked.has(y * BOARD_WIDTH + x);
  }
}

function put(board: Board, kind: PieceKind, rotation: Rotation, x: number, y: number): void {
  board.lock({ kind, rotation, x, y });
}

function tap(sim: Simulation, flag: number, times = 1): void {
  for (let i = 0; i < times; i += 1) {
    sim.step(press(flag));
    sim.step(IDLE);
  }
}

/** Copies the reused outcome so later steps cannot change it. */
function snapshot(outcome: StepOutcome): StepOutcome {
  return { ...outcome, clearedRows: [...outcome.clearedRows] };
}

/** Nine vertical I pieces fill columns 1..9 up to row 3, leaving column 0 for the active I. */
function fillColumnsOneToNine(board: Board): void {
  for (let column = 1; column <= 9; column += 1) put(board, 'I', 1, column - 2, 0);
}

describe('Simulation: start', () => {
  it('spawns the first piece at the top and exposes the queue', () => {
    const view = new Simulation(identityPrng(), 1).view();
    expect([view.active.kind, view.active.rotation, view.active.x, view.active.y]).toEqual([
      'I',
      0,
      3,
      19,
    ]);
    expect(view.next).toEqual(['O', 'T', 'S', 'Z', 'J']);
    expect([view.held, view.phase, view.points, view.lines, view.level]).toEqual([
      null,
      'Falling',
      0,
      0,
      1,
    ]);
    expect(view.ghostY).toBe(-2);
  });

  it('starts at the requested level', () => {
    expect(new Simulation(identityPrng(), 7).view().level).toBe(7);
  });

  it('returns the same outcome object on every step (reused)', () => {
    const sim = new Simulation(identityPrng(), 1);
    expect(sim.step(IDLE)).toBe(sim.step(IDLE));
  });
});

describe('Simulation: gravity', () => {
  it('level 1 drops one cell every 64 steps', () => {
    const sim = new Simulation(identityPrng(), 1);
    for (let i = 0; i < 63; i += 1) sim.step(IDLE);
    expect(sim.view().active.y).toBe(19);
    sim.step(IDLE);
    expect(sim.view().active.y).toBe(18);
  });

  it('a higher level falls faster', () => {
    const sim = new Simulation(identityPrng(), 5);
    for (let i = 0; i < 21; i += 1) sim.step(IDLE);
    expect(sim.view().active.y).toBe(19);
    sim.step(IDLE);
    expect(sim.view().active.y).toBe(18);
  });

  it('soft drop is 20 times faster and scores one point per cell', () => {
    const sim = new Simulation(identityPrng(), 1);
    for (let i = 0; i < 3; i += 1) sim.step({ held: Intent.SoftDrop, pressed: 0 });
    expect(sim.view().active.y).toBe(19);
    sim.step({ held: Intent.SoftDrop, pressed: 0 });
    expect(sim.view().active.y).toBe(18);
    expect(sim.view().points).toBe(1);
  });

  it('hard drop lands at once, scores two points per cell and spawns the next piece', () => {
    const sim = new Simulation(identityPrng(), 1);
    const out = snapshot(sim.step(press(Intent.HardDrop)));
    expect(out).toEqual({ clearedRows: [], spin: 'None', locked: true, toppedOut: false });
    expect(sim.view().points).toBe(42);
    expect(sim.view().active.kind).toBe('O');
    expect(sim.view().cells.isOccupied(3, 0)).toBe(true);
    expect(sim.view().cells.isOccupied(6, 0)).toBe(true);
  });
});

describe('Simulation: movement', () => {
  it('shifts on a press and stops at the wall', () => {
    const sim = new Simulation(identityPrng(), 1);
    tap(sim, Intent.Left);
    expect(sim.view().active.x).toBe(2);
    tap(sim, Intent.Left, 5);
    expect(sim.view().active.x).toBe(0);
    tap(sim, Intent.Right, 2);
    expect(sim.view().active.x).toBe(2);
  });

  it('auto-repeats a held direction after the delay', () => {
    const sim = new Simulation(identityPrng(), 1);
    sim.step(press(Intent.Right));
    for (let i = 0; i < 10; i += 1) sim.step({ held: Intent.Right, pressed: 0 });
    expect(sim.view().active.x).toBe(5);
  });

  it('rotates both ways and wraps around', () => {
    const sim = new Simulation(identityPrng(), 1);
    tap(sim, Intent.RotateCw);
    expect(sim.view().active.rotation).toBe(1);
    tap(sim, Intent.RotateCcw, 2);
    expect(sim.view().active.rotation).toBe(3);
  });

  it('holding a rotation key does not rotate again', () => {
    const sim = new Simulation(identityPrng(), 1);
    sim.step(press(Intent.RotateCw));
    sim.step({ held: Intent.RotateCw, pressed: 0 });
    expect(sim.view().active.rotation).toBe(1);
  });

  it('uses a wall kick when the plain rotation does not fit', () => {
    const board = new ObstacleBoard();
    board.block([4, 19]);
    const sim = new Simulation(tFirstPrng(), 1, board);
    sim.step(press(Intent.RotateCw));
    const view = sim.view();
    expect([view.active.rotation, view.active.x, view.active.y]).toEqual([1, 2, 19]);
  });

  it('keeps the rotation when no kick fits', () => {
    const board = new ObstacleBoard();
    board.block([4, 19], [3, 21], [3, 22], [4, 17], [3, 19], [2, 17], [3, 18], [4, 18]);
    const sim = new Simulation(tFirstPrng(), 1, board);
    sim.step(press(Intent.RotateCw));
    expect(sim.view().active.rotation).toBe(0);
  });

  it('ghost sits where a hard drop would land', () => {
    const board = new Board();
    put(board, 'O', 0, 3, -1);
    const sim = new Simulation(identityPrng(), 1, board);
    expect(sim.view().ghostY).toBe(sim.view().active.y - board.dropDistance(sim.view().active));
  });
});

describe('Simulation: lock delay', () => {
  function landed(sim: Simulation): number {
    let steps = 0;
    while (sim.view().active.y > -2) {
      sim.step({ held: Intent.SoftDrop, pressed: 0 });
      steps += 1;
    }
    return steps;
  }

  it('locks 30 steps after landing, not before', () => {
    const sim = new Simulation(identityPrng(), 1);
    landed(sim);
    // The landing step already counted as the first grounded step.
    for (let i = 0; i < 28; i += 1) expect(sim.step(IDLE).locked).toBe(false);
    expect(sim.step(IDLE).locked).toBe(true);
  });

  it('a successful grounded move restarts the countdown', () => {
    const sim = new Simulation(identityPrng(), 1);
    landed(sim);
    for (let i = 0; i < 20; i += 1) sim.step(IDLE);
    // The step holding the move counts as the first of the new countdown.
    sim.step(press(Intent.Left));
    for (let i = 0; i < 28; i += 1) expect(sim.step(IDLE).locked).toBe(false);
    expect(sim.step(IDLE).locked).toBe(true);
  });

  it('locks once 15 resets are spent', () => {
    const sim = new Simulation(identityPrng(), 1);
    landed(sim);
    let locked = false;
    let moves = 0;
    while (!locked) {
      locked = sim.step(press(moves % 2 === 0 ? Intent.Left : Intent.Right)).locked;
      moves += 1;
    }
    // Sitting on the floor, every grounded move spends one reset: the piece locks as the 15th is spent.
    expect(moves).toBe(15);
  });
});

describe('Simulation: hold', () => {
  it('stores the piece and brings the next one, once per piece', () => {
    const sim = new Simulation(identityPrng(), 1);
    sim.step(press(Intent.Hold));
    expect([sim.view().held, sim.view().active.kind]).toEqual(['I', 'O']);
    sim.step(press(Intent.Hold));
    expect([sim.view().held, sim.view().active.kind]).toEqual(['I', 'O']);
  });

  it('swaps with the held piece after the next lock, respawning at the top', () => {
    const sim = new Simulation(identityPrng(), 1);
    sim.step(press(Intent.Hold));
    tap(sim, Intent.RotateCw);
    sim.step(press(Intent.HardDrop));
    expect(sim.view().active.kind).toBe('T');
    sim.step(press(Intent.Hold));
    const view = sim.view();
    expect([
      view.held,
      view.active.kind,
      view.active.rotation,
      view.active.x,
      view.active.y,
    ]).toEqual(['T', 'I', 0, 3, 19]);
  });

  it('tops out when the swapped-in piece does not fit', () => {
    const board = new ObstacleBoard();
    const sim = new Simulation(identityPrng(), 1, board);
    board.block([3, 21]);
    sim.step(press(Intent.Hold));
    sim.step(press(Intent.HardDrop));
    expect(sim.view().active.kind).toBe('T');
    expect(sim.step(press(Intent.Hold)).toppedOut).toBe(true);
  });
});

describe('Simulation: line clears', () => {
  it('clears a single line after a 20-step Clearing phase that ignores input', () => {
    const board = new Board();
    put(board, 'I', 0, 4, -2);
    put(board, 'O', 0, 7, -1);
    const sim = new Simulation(identityPrng(), 1, board);
    tap(sim, Intent.Left, 3);
    const out = snapshot(sim.step(press(Intent.HardDrop)));
    expect(out.clearedRows).toEqual([0]);
    expect(sim.view().points).toBe(42 + 100);
    expect(sim.view().lines).toBe(1);
    expect(sim.view().phase).toBe('Clearing');
    expect(sim.view().clearFrames).toBe(20);
    for (let remaining = 19; remaining >= 1; remaining -= 1) {
      const step = snapshot(sim.step(press(Intent.HardDrop | Intent.Hold)));
      expect(step.clearedRows).toEqual([]);
      expect(sim.view().phase).toBe('Clearing');
      expect(sim.view().clearFrames).toBe(remaining);
    }
    sim.step(IDLE);
    expect(sim.view().phase).toBe('Falling');
    expect(sim.view().active.kind).toBe('O');
    expect(sim.view().points).toBe(142);
    expect(sim.view().held).toBeNull();
    // The cleared row is gone; the O's second row fell down to row 0.
    expect(sim.view().cells.isOccupied(0, 0)).toBe(false);
    expect(sim.view().cells.isOccupied(8, 0)).toBe(true);
    expect(sim.view().cells.isOccupied(8, 1)).toBe(false);
  });

  it('scores a four-line clear with the drop and spawns after the delay', () => {
    const board = new Board();
    fillColumnsOneToNine(board);
    const sim = new Simulation(identityPrng(), 1, board);
    tap(sim, Intent.RotateCw);
    tap(sim, Intent.Left, 5);
    expect(sim.view().active.x).toBe(-2);
    const out = snapshot(sim.step(press(Intent.HardDrop)));
    expect(out.clearedRows).toEqual([0, 1, 2, 3]);
    expect(sim.view().points).toBe(2 * 19 + 800);
    for (let i = 0; i < 20; i += 1) sim.step(IDLE);
    expect(sim.view().phase).toBe('Falling');
    for (let y = 0; y < 4; y += 1) expect(sim.view().cells.isOccupied(0, y)).toBe(false);
  });

  it('tops out when the spawn is blocked after the Clearing phase', () => {
    const board = new ObstacleBoard();
    fillColumnsOneToNine(board);
    const sim = new Simulation(identityPrng(), 1, board);
    tap(sim, Intent.RotateCw);
    tap(sim, Intent.Left, 5);
    sim.step(press(Intent.HardDrop));
    board.block([4, 20]);
    for (let i = 0; i < 19; i += 1) expect(sim.step(IDLE).toppedOut).toBe(false);
    expect(sim.step(IDLE).toppedOut).toBe(true);
  });
});

describe('Simulation: top-out', () => {
  it('block out: the next piece does not fit', () => {
    const board = new Board();
    put(board, 'O', 0, 3, 18);
    const sim = new Simulation(identityPrng(), 1, board);
    tap(sim, Intent.Left, 3);
    const out = sim.step(press(Intent.HardDrop));
    expect(out.locked).toBe(true);
    expect(out.toppedOut).toBe(true);
  });

  it('lock out: a piece locks entirely in the buffer', () => {
    const board = new Board();
    for (let column = 3; column <= 6; column += 1) {
      for (let row = 0; row < 20; row += 4) put(board, 'I', 1, column - 2, row);
    }
    const sim = new Simulation(identityPrng(), 1, board);
    const out = sim.step(press(Intent.HardDrop));
    expect(out.locked).toBe(true);
    expect(out.toppedOut).toBe(true);
  });

  it('stays over: later steps change nothing', () => {
    const board = new Board();
    put(board, 'O', 0, 3, 18);
    const sim = new Simulation(identityPrng(), 1, board);
    tap(sim, Intent.Left, 3);
    sim.step(press(Intent.HardDrop));
    const points = sim.view().points;
    const out = snapshot(sim.step(press(Intent.HardDrop | Intent.Hold)));
    expect(out).toEqual({ clearedRows: [], spin: 'None', locked: false, toppedOut: true });
    expect(sim.view().points).toBe(points);
  });

  it('is already over when the first piece does not fit', () => {
    const board = new Board();
    put(board, 'I', 0, 3, 19);
    const sim = new Simulation(identityPrng(), 1, board);
    expect(sim.step(IDLE).toppedOut).toBe(true);
  });
});

describe('Simulation: T-spin', () => {
  function rotateThenLock(
    blocked: readonly (readonly [number, number])[],
    rotations: readonly number[] = [Intent.RotateCw],
  ): StepOutcome {
    const board = new ObstacleBoard();
    board.block(...blocked);
    const sim = new Simulation(tFirstPrng(), 1, board);
    for (const rotation of rotations) sim.step(press(rotation));
    return snapshot(sim.step(press(Intent.HardDrop)));
  }

  it('Full: both front corners and one back corner are occupied', () => {
    const out = rotateThenLock([
      [5, 19],
      [5, 21],
      [3, 19],
      [4, 18],
    ]);
    expect(out.spin).toBe('Full');
  });

  it('Mini: three corners but only one front corner', () => {
    const out = rotateThenLock([
      [5, 19],
      [3, 19],
      [3, 21],
      [4, 18],
    ]);
    expect(out.spin).toBe('Mini');
  });

  it('None: fewer than three corners', () => {
    const out = rotateThenLock([
      [5, 19],
      [3, 19],
      [4, 18],
    ]);
    expect(out.spin).toBe('None');
  });

  it('the last SRS kick makes it a full T-spin whatever the front corners', () => {
    const out = rotateThenLock([
      [4, 19],
      [3, 21],
      [2, 17],
      [2, 19],
      [3, 16],
    ]);
    expect(out.spin).toBe('Full');
  });

  it('Full, pointing down: both bottom corners are front', () => {
    const blocked = [
      [3, 19],
      [5, 19],
      [3, 21],
      [4, 18],
    ] as const;
    const out = rotateThenLock(blocked, [Intent.RotateCw, Intent.RotateCw]);
    expect(out.spin).toBe('Full');
  });

  it('Mini, pointing down: one bottom corner is empty', () => {
    const blocked = [
      [3, 19],
      [3, 21],
      [5, 21],
      [4, 18],
    ] as const;
    const out = rotateThenLock(blocked, [Intent.RotateCw, Intent.RotateCw]);
    expect(out.spin).toBe('Mini');
  });

  it('Full, pointing left: both left corners are front', () => {
    const blocked = [
      [3, 19],
      [3, 21],
      [5, 19],
      [4, 18],
    ] as const;
    expect(rotateThenLock(blocked, [Intent.RotateCcw]).spin).toBe('Full');
  });

  it('Mini, pointing left: one left corner is empty', () => {
    const blocked = [
      [3, 19],
      [5, 19],
      [5, 21],
      [4, 18],
    ] as const;
    expect(rotateThenLock(blocked, [Intent.RotateCcw]).spin).toBe('Mini');
  });

  it('Full, pointing up: both top corners are front', () => {
    const blocked = [
      [3, 19],
      [3, 21],
      [5, 21],
      [5, 19],
    ] as const;
    expect(rotateThenLock(blocked, [Intent.RotateCw, Intent.RotateCcw]).spin).toBe('Full');
  });

  it('Mini, pointing up: one top corner is empty', () => {
    const blocked = [
      [3, 19],
      [3, 21],
      [5, 19],
    ] as const;
    expect(rotateThenLock(blocked, [Intent.RotateCw, Intent.RotateCcw]).spin).toBe('Mini');
  });

  describe('is lost when the T moves after rotating', () => {
    // Pointing left at (3,19): a one-cell fall to y = 18 meets three solid corners, with the
    // top-left one empty, so it would be a Mini if the rotation still counted. (5,20) is a cell
    // of the spawned T, hence the pocket is built after the spawn.
    function rotatedIntoPocket(): { sim: Simulation } {
      const board = new ObstacleBoard();
      const sim = new Simulation(tFirstPrng(), 1, board);
      board.block([3, 18], [5, 18], [5, 20], [4, 17]);
      sim.step(press(Intent.RotateCcw));
      expect(sim.view().active.rotation).toBe(3);
      return { sim };
    }

    it('after a gravity fall', () => {
      const { sim } = rotatedIntoPocket();
      for (let i = 0; i < 4; i += 1) sim.step({ held: Intent.SoftDrop, pressed: 0 });
      expect(sim.view().active.y).toBe(18);
      expect(snapshot(sim.step(press(Intent.HardDrop))).spin).toBe('None');
    });

    it('after a hard drop that moves it', () => {
      const { sim } = rotatedIntoPocket();
      const out = snapshot(sim.step(press(Intent.HardDrop)));
      expect(sim.view().cells.isOccupied(4, 18)).toBe(true);
      expect(out.spin).toBe('None');
    });
  });

  it('scores the spin with the lock', () => {
    const board = new ObstacleBoard();
    board.block([5, 19], [5, 21], [3, 19], [4, 18]);
    const sim = new Simulation(tFirstPrng(), 1, board);
    sim.step(press(Intent.RotateCw));
    sim.step(press(Intent.HardDrop));
    expect(sim.view().points).toBe(400);
  });

  it('only a T can spin', () => {
    const board = new ObstacleBoard();
    // The I stands vertical in column 5 (rows 19-22): all four corners of its box are solid.
    board.block([3, 19], [5, 19], [3, 21], [5, 21], [5, 18]);
    const sim = new Simulation(identityPrng(), 1, board);
    sim.step(press(Intent.RotateCw));
    expect(snapshot(sim.step(press(Intent.HardDrop))).spin).toBe('None');
  });
});

describe('Simulation: determinism', () => {
  function play(seed: number): readonly string[] {
    const sim = new Simulation(new SeededPrng(seed), 1);
    const input = new SeededPrng(seed + 1);
    const flags = [
      Intent.Left,
      Intent.Right,
      Intent.SoftDrop,
      Intent.HardDrop,
      Intent.RotateCw,
      Intent.RotateCcw,
      Intent.Hold,
    ];
    const trace: string[] = [];
    for (let i = 0; i < 4000; i += 1) {
      const pressed = (flags[input.nextInt(flags.length)] ?? 0) * input.nextInt(2);
      const held = pressed | (input.nextInt(4) === 0 ? Intent.SoftDrop : 0);
      const out = sim.step({ held, pressed });
      const view = sim.view();
      trace.push(
        `${String(out.toppedOut)}|${String(view.points)}|${String(view.lines)}|${view.active.kind}${String(view.active.x)},${String(view.active.y)}`,
      );
      if (out.toppedOut) break;
    }
    return trace;
  }

  it('the same seed and the same inputs give the same game', () => {
    expect(play(42)).toEqual(play(42));
    expect(play(42)).not.toEqual(play(43));
  });

  it('never throws and scores monotonically over a long random game', () => {
    const trace = play(7);
    let previous = 0;
    for (const entry of trace) {
      const points = Number(entry.split('|')[1]);
      expect(points).toBeGreaterThanOrEqual(previous);
      previous = points;
    }
  });
});
