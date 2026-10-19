import type { Clock } from '../domain/ports/clock';
import type { FrameTarget } from '../domain/ports/frame-target';
import type { InputPort, MutableIntentFrame } from '../domain/ports/input-port';

/** Simulation steps per second (GDD §3: every duration is a frame count at 60 Hz). */
const STEPS_PER_SECOND = 60;
/** One simulation step in wall-clock milliseconds. */
export const STEP_MS = 1000 / STEPS_PER_SECOND;
/** A single frame never advances the simulation by more than this (copied from retro-shmup, ADR-0002). */
const MAX_FRAME_MS = 250;

// Tolerance for the floating-point remainder of repeated 1000 / 60 subtractions.
const EPSILON_MS = 1e-6;

/** `requestAnimationFrame` in the browser; a manual trigger in tests. */
export type ScheduleFrame = (callback: () => void) => void;

/**
 * Fixed-timestep frame loop (ADR-0002, Fiedler's "Fix Your Timestep!"), copied from retro-shmup
 * without the time scale: wall time, clamped, fills an accumulator that is drained in whole steps
 * of 1/60 s. The input is read once per step into one reused frame. The accumulator starts half a
 * step full, so on a 60 Hz display clock jitter never turns one step per frame into 0 or 2.
 */
export class FrameLoop {
  private readonly frame: MutableIntentFrame = { held: 0, pressed: 0 };
  private lastMs: number | undefined;
  private accumulatorMs = 0;
  private running = false;
  private scheduled = false;
  // Bumped by start() and stop(): a tick whose step changed the lifecycle ends on the spot.
  private generation = 0;
  private readonly clock: Clock;
  private readonly input: InputPort;
  private readonly target: FrameTarget;
  private readonly schedule: ScheduleFrame;

  constructor(clock: Clock, input: InputPort, target: FrameTarget, schedule: ScheduleFrame) {
    this.clock = clock;
    this.input = input;
    this.target = target;
    this.schedule = schedule;
  }

  /** Starts, or restarts after `stop()`: the time origin is reset and the remainder discarded. No-op while running. */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.generation += 1;
    this.lastMs = undefined;
    this.accumulatorMs = STEP_MS / 2;
    this.scheduleOnce();
  }

  /** Safe to call from inside `step()`: the remaining steps of the tick and its render are skipped. */
  stop(): void {
    this.running = false;
    this.generation += 1;
  }

  // At most one pending frame callback, whatever the start / stop sequence.
  private scheduleOnce(): void {
    if (this.scheduled) return;
    this.scheduled = true;
    this.schedule(this.onFrame);
  }

  private readonly onFrame = (): void => {
    this.scheduled = false;
    if (!this.running) return;
    this.tick(this.clock.now());
    this.scheduleOnce();
  };

  private tick(nowMs: number): void {
    const elapsed = this.lastMs === undefined ? 0 : nowMs - this.lastMs;
    this.lastMs = nowMs;
    this.accumulatorMs += Math.min(Math.max(elapsed, 0), MAX_FRAME_MS);
    const generation = this.generation;
    while (this.accumulatorMs + EPSILON_MS >= STEP_MS) {
      this.input.read(this.frame);
      this.target.step(this.frame);
      if (this.generation !== generation) return;
      this.accumulatorMs -= STEP_MS;
    }
    this.accumulatorMs = Math.max(this.accumulatorMs, 0);
    this.target.render();
  }
}
