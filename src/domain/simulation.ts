import { spawnPiece, type ActivePiece } from './active-piece';
import { AutoShift } from './auto-shift';
import { Bag7 } from './bag7';
import { Board } from './board';
import { SUB_CELLS_PER_CELL, subCellsPerStep } from './gravity';
import { Intent, type IntentFrame } from './intent';
import { LockDelay } from './lock-delay';
import type { PieceKind } from './piece-kind';
import type { Prng } from './ports/prng';
import { Scoring } from './scoring';
import type { SpinKind } from './spin-kind';
import { kicks, type Rotation } from './srs';

/** Where the piece is in its life: under control, or frozen while cleared rows flash (UML 02-state). */
export type Phase = 'Falling' | 'Clearing';

/** What one `step` did. The object is reused: read it before the next `step`. */
export interface StepOutcome {
  /** Rows completed by this step's lock, ascending; the array is reused like `Board.lock`'s. */
  readonly clearedRows: readonly number[];
  readonly spin: SpinKind;
  readonly locked: boolean;
  /** Block out or lock out: the run is over and further steps change nothing. */
  readonly toppedOut: boolean;
}

/** Read-only access to the locked cells, for the renderer. */
export interface BoardView {
  isOccupied(x: number, y: number): boolean;
}

/**
 * Everything the presenter draws. The object, `active` and `next` are reused: read them before the
 * next `step` or `view` call. While `phase` is Clearing, `active` is the piece just locked: it is
 * already part of `cells`, do not draw it twice.
 */
export interface SimView {
  readonly cells: BoardView;
  readonly active: ActivePiece;
  /** Row the active piece would land on after a hard drop. */
  readonly ghostY: number;
  readonly held: PieceKind | null;
  readonly next: readonly PieceKind[];
  readonly points: number;
  readonly level: number;
  readonly lines: number;
  readonly phase: Phase;
  readonly clearFrames: number;
}

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

const CLEAR_FRAMES = 20;
const PREVIEW_COUNT = 5;
const SOFT_DROP_FACTOR = 20;
const NO_KICK = -1;
const LAST_KICK = 4;
const NO_ROWS: readonly number[] = [];
const NO_KINDS: readonly PieceKind[] = [];

const CLOCKWISE: readonly [Rotation, Rotation, Rotation, Rotation] = [1, 2, 3, 0];
const COUNTER_CLOCKWISE: readonly [Rotation, Rotation, Rotation, Rotation] = [3, 0, 1, 2];

// Spawn poses built once, so spawning copies four fields and allocates nothing.
const SPAWNS: Readonly<Record<PieceKind, ActivePiece>> = {
  I: spawnPiece('I'),
  O: spawnPiece('O'),
  T: spawnPiece('T'),
  S: spawnPiece('S'),
  Z: spawnPiece('Z'),
  J: spawnPiece('J'),
  L: spawnPiece('L'),
};

/**
 * The deterministic game: one `step` per 60 Hz tick, no clock, randomness only from the injected
 * `Prng` (UML 02-class, 03-sequence-piece-lifecycle). Step order: hold → rotate → shift → drop →
 * gravity → lock. After a top-out every later step is a no-op that reports `toppedOut`.
 */
export class Simulation {
  private readonly board: Board;
  private readonly bag: Bag7;
  private readonly shift = new AutoShift();
  private readonly lockDelay = new LockDelay();
  private readonly score: Scoring;
  private readonly active: Mutable<ActivePiece> = { kind: 'I', rotation: 0, x: 0, y: 0 };
  // Scratch pose for "would it fit?" questions, so trying a move allocates nothing.
  private readonly probe: Mutable<ActivePiece> = { kind: 'I', rotation: 0, x: 0, y: 0 };
  private readonly outcome: Mutable<StepOutcome> = {
    clearedRows: NO_ROWS,
    spin: 'None',
    locked: false,
    toppedOut: false,
  };
  private readonly snapshot: Mutable<SimView>;
  private held: PieceKind | null = null;
  private holdUsed = false;
  private phase: Phase = 'Falling';
  private clearFrames = 0;
  private gravitySub = 0;
  // Index of the SRS test that succeeded in the last rotation (0..4), or NO_KICK after any move or fall.
  private lastRotationKick = NO_KICK;
  private pendingRows: readonly number[] = NO_ROWS;
  private over = false;

  /** `board` defaults to an empty one; tests pass a prepared board. */
  constructor(rng: Prng, startLevel: number, board: Board = new Board()) {
    this.board = board;
    this.bag = new Bag7(rng);
    this.score = new Scoring(startLevel);
    this.snapshot = {
      cells: board,
      active: this.active,
      ghostY: 0,
      held: null,
      next: NO_KINDS,
      points: 0,
      level: startLevel,
      lines: 0,
      phase: 'Falling',
      clearFrames: 0,
    };
    this.spawnNext();
  }

  /** Advances the game by one fixed 60 Hz step. The returned outcome is reused. */
  step(intent: IntentFrame): StepOutcome {
    const out = this.outcome;
    out.clearedRows = NO_ROWS;
    out.spin = 'None';
    out.locked = false;
    if (!this.over) {
      if (this.phase === 'Clearing') this.stepClearing();
      else this.stepFalling(intent);
    }
    out.toppedOut = this.over;
    return out;
  }

  /** Refreshes and returns the reused view of the current state. */
  view(): SimView {
    const v = this.snapshot;
    v.held = this.held;
    v.ghostY =
      this.phase === 'Falling'
        ? this.active.y - this.board.dropDistance(this.active)
        : this.active.y;
    v.next = this.bag.preview(PREVIEW_COUNT);
    v.points = this.score.points;
    v.level = this.score.level;
    v.lines = this.score.lines;
    v.phase = this.phase;
    v.clearFrames = this.clearFrames;
    return v;
  }

  private stepClearing(): void {
    this.clearFrames -= 1;
    if (this.clearFrames > 0) return;
    this.board.clearRows(this.pendingRows);
    this.pendingRows = NO_ROWS;
    this.phase = 'Falling';
    this.spawnNext();
  }

  private stepFalling(intent: IntentFrame): void {
    const { held, pressed } = intent;
    if ((pressed & Intent.Hold) !== 0) {
      this.tryHold();
      if (this.over) return;
    }
    if ((pressed & Intent.RotateCw) !== 0) this.tryRotate(true);
    if ((pressed & Intent.RotateCcw) !== 0) this.tryRotate(false);
    const dx = this.shift.step(held, pressed);
    if (dx !== 0) this.tryShift(dx);
    if ((pressed & Intent.HardDrop) === 0) this.fall((held & Intent.SoftDrop) !== 0);
    else this.hardDrop();
  }

  private tryHold(): void {
    if (this.holdUsed) return;
    const stored = this.held;
    this.held = this.active.kind;
    this.holdUsed = true;
    this.spawn(stored ?? this.bag.next());
  }

  private tryRotate(clockwise: boolean): void {
    const from = this.active.rotation;
    const to = clockwise ? CLOCKWISE[from] : COUNTER_CLOCKWISE[from];
    const tests = kicks(this.active.kind, from, to);
    for (let i = 0; i < tests.length; i += 1) {
      const offset = tests[i];
      if (offset === undefined) continue;
      this.setProbe(to, this.active.x + offset.x, this.active.y + offset.y);
      if (!this.board.fits(this.probe)) continue;
      this.moveTo(this.probe);
      this.lastRotationKick = i;
      this.lockDelay.onMoveOrRotate(this.isGrounded());
      return;
    }
  }

  private tryShift(dx: number): void {
    this.setProbe(this.active.rotation, this.active.x + dx, this.active.y);
    if (!this.board.fits(this.probe)) return;
    this.moveTo(this.probe);
    this.lastRotationKick = NO_KICK;
    this.lockDelay.onMoveOrRotate(this.isGrounded());
  }

  private hardDrop(): void {
    const distance = this.board.dropDistance(this.active);
    if (distance > 0) {
      this.active.y -= distance;
      this.lastRotationKick = NO_KICK;
    }
    this.score.addDrop(distance, true);
    this.lockPiece();
  }

  private fall(soft: boolean): void {
    this.gravitySub += subCellsPerStep(this.score.level) * (soft ? SOFT_DROP_FACTOR : 1);
    const cells = Math.floor(this.gravitySub / SUB_CELLS_PER_CELL);
    this.gravitySub -= cells * SUB_CELLS_PER_CELL;
    let dropped = 0;
    while (dropped < cells && this.canDescend()) {
      this.active.y -= 1;
      dropped += 1;
      this.lockDelay.onDescend(this.active.y);
    }
    if (dropped > 0) {
      this.lastRotationKick = NO_KICK;
      if (soft) this.score.addDrop(dropped, false);
    }
    const grounded = !this.canDescend();
    // Gravity does not pile up against the floor or the stack.
    if (grounded) this.gravitySub = 0;
    if (this.lockDelay.tick(grounded)) this.lockPiece();
  }

  private lockPiece(): void {
    const spin = this.detectSpin();
    const lockOut = this.board.isLockOut(this.active);
    const rows = this.board.lock(this.active);
    const out = this.outcome;
    out.locked = true;
    out.spin = spin;
    out.clearedRows = rows;
    this.score.award(rows.length, spin);
    if (lockOut) {
      this.over = true;
    } else if (rows.length > 0) {
      this.phase = 'Clearing';
      this.clearFrames = CLEAR_FRAMES;
      this.pendingRows = rows;
    } else {
      this.spawnNext();
    }
  }

  private spawnNext(): void {
    this.holdUsed = false;
    this.spawn(this.bag.next());
  }

  private spawn(kind: PieceKind): void {
    this.moveTo(SPAWNS[kind]);
    this.lockDelay.reset(this.active.y);
    this.gravitySub = 0;
    this.lastRotationKick = NO_KICK;
    if (!this.board.fits(this.active)) this.over = true;
  }

  // T-spin rule (GDD §4): the T's last action was a rotation, at least 3 of the 4 corners of its
  // 3 × 3 box are solid (walls and floor count), and either both front corners are solid or the
  // rotation used the last SRS kick.
  private detectSpin(): SpinKind {
    const { kind, rotation, x, y } = this.active;
    if (kind !== 'T' || this.lastRotationKick === NO_KICK) return 'None';
    const bottomLeft = this.board.isOccupied(x, y);
    const bottomRight = this.board.isOccupied(x + 2, y);
    const topLeft = this.board.isOccupied(x, y + 2);
    const topRight = this.board.isOccupied(x + 2, y + 2);
    const corners = Number(bottomLeft) + Number(bottomRight) + Number(topLeft) + Number(topRight);
    if (corners < 3) return 'None';
    let front: boolean;
    switch (rotation) {
      case 0:
        front = topLeft && topRight;
        break;
      case 1:
        front = topRight && bottomRight;
        break;
      case 2:
        front = bottomLeft && bottomRight;
        break;
      case 3:
        front = topLeft && bottomLeft;
        break;
    }
    return front || this.lastRotationKick === LAST_KICK ? 'Full' : 'Mini';
  }

  private canDescend(): boolean {
    this.setProbe(this.active.rotation, this.active.x, this.active.y - 1);
    return this.board.fits(this.probe);
  }

  private isGrounded(): boolean {
    return !this.canDescend();
  }

  private setProbe(rotation: Rotation, x: number, y: number): void {
    this.probe.kind = this.active.kind;
    this.probe.rotation = rotation;
    this.probe.x = x;
    this.probe.y = y;
  }

  private moveTo(pose: ActivePiece): void {
    this.active.kind = pose.kind;
    this.active.rotation = pose.rotation;
    this.active.x = pose.x;
    this.active.y = pose.y;
  }
}
