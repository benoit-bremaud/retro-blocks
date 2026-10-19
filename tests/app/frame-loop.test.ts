import { describe, expect, it } from 'vitest';
import type { Clock } from '../../src/domain/ports/clock';
import type { FrameTarget } from '../../src/domain/ports/frame-target';
import type { InputPort, IntentFrame } from '../../src/domain/ports/input-port';
import { FrameLoop, STEP_MS } from '../../src/app/frame-loop';

class ManualClock implements Clock {
  ms = 0;
  now(): number {
    return this.ms;
  }
}

class Harness implements FrameTarget, InputPort {
  steps: IntentFrame[] = [];
  renders = 0;
  reads = 0;
  onStep: (() => void) | undefined;
  readonly clock = new ManualClock();
  private callback: (() => void) | undefined;
  readonly loop = new FrameLoop(this.clock, this, this, (cb) => {
    this.callback = cb;
  });

  read(into: { held: number; pressed: number }): void {
    this.reads += 1;
    into.held = this.reads;
  }
  step(frame: IntentFrame): void {
    this.steps.push({ ...frame });
    this.onStep?.();
  }
  render(): void {
    this.renders += 1;
  }
  /** Advances the clock and runs the pending frame callback, as a browser frame would. */
  frame(deltaMs: number): void {
    this.clock.ms += deltaMs;
    const cb = this.callback;
    this.callback = undefined;
    cb?.();
  }
  get pending(): boolean {
    return this.callback !== undefined;
  }
}

describe('FrameLoop', () => {
  it('runs one step per 60 Hz frame and renders each frame', () => {
    const h = new Harness();
    h.loop.start();
    // The first frame only sets the time origin; the half-full accumulator then yields one step per frame.
    for (let i = 0; i < 11; i += 1) h.frame(STEP_MS);
    expect(h.steps).toHaveLength(10);
    expect(h.renders).toBe(11);
  });

  it('runs several steps for a slow frame and none for a fast one', () => {
    const h = new Harness();
    h.loop.start();
    h.frame(0);
    const before = h.steps.length;
    h.frame(STEP_MS * 3);
    expect(h.steps.length - before).toBe(3);
    h.frame(STEP_MS / 4);
    expect(h.steps.length - before).toBe(3);
  });

  it('clamps a long pause to MAX_FRAME_MS of steps', () => {
    const h = new Harness();
    h.loop.start();
    h.frame(0);
    const before = h.steps.length;
    h.frame(10_000);
    // 250 ms plus the half-step seed: exactly 15 whole steps.
    expect(h.steps.length - before).toBe(15);
  });

  it('reads the input once per step into the frame it steps with', () => {
    const h = new Harness();
    h.loop.start();
    h.frame(STEP_MS * 2);
    expect(h.reads).toBe(h.steps.length);
    expect(h.steps.map((s) => s.held)).toEqual(h.steps.map((_s, i) => i + 1));
  });

  it('ignores a clock that goes backwards', () => {
    const h = new Harness();
    h.loop.start();
    h.frame(STEP_MS);
    const before = h.steps.length;
    h.frame(-100);
    expect(h.steps.length).toBe(before);
    h.frame(STEP_MS);
    expect(h.steps.length).toBe(before + 1);
  });

  it('does nothing after stop, and a second start does not double the chain', () => {
    const h = new Harness();
    h.loop.start();
    h.loop.start();
    h.frame(STEP_MS);
    h.loop.stop();
    const steps = h.steps.length;
    h.frame(STEP_MS * 5);
    expect(h.steps).toHaveLength(steps);
    expect(h.pending).toBe(false);
  });

  it('ends the tick on the spot when a step stops the loop', () => {
    const h = new Harness();
    h.loop.start();
    h.frame(0);
    h.onStep = () => {
      h.loop.stop();
    };
    const rendersBefore = h.renders;
    h.frame(STEP_MS * 3);
    expect(h.steps).toHaveLength(1);
    expect(h.renders).toBe(rendersBefore);
  });

  it('restarts with a clean time origin', () => {
    const h = new Harness();
    h.loop.start();
    h.frame(STEP_MS);
    h.loop.stop();
    h.frame(0);
    h.clock.ms += 5000;
    h.loop.start();
    const before = h.steps.length;
    // The origin is reset: no catch-up for the 5 s stopped, and the half-step seed gives one step a frame later.
    h.frame(0);
    expect(h.steps.length - before).toBe(0);
    h.frame(STEP_MS);
    expect(h.steps.length - before).toBe(1);
  });
});
