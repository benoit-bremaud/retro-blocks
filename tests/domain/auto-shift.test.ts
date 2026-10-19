import { describe, expect, it } from 'vitest';
import { AutoShift } from '../../src/domain/auto-shift';
import { Intent } from '../../src/domain/intent';

const L = Intent.Left;
const R = Intent.Right;

/** Holds `held` for `steps` steps; `pressed` applies to the first one. Returns each step's shift. */
function run(shift: AutoShift, held: number, pressed: number, steps: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < steps; i += 1) out.push(shift.step(held, i === 0 ? pressed : 0));
  return out;
}

describe('AutoShift', () => {
  it('does nothing without input', () => {
    expect(run(new AutoShift(), 0, 0, 5)).toEqual([0, 0, 0, 0, 0]);
  });

  it('moves one cell on the press, waits DAS 10, then repeats every ARR 2', () => {
    const out = run(new AutoShift(), L, L, 15);
    expect(out).toEqual([-1, 0, 0, 0, 0, 0, 0, 0, 0, 0, -1, 0, -1, 0, -1]);
  });

  it('shifts right with +1', () => {
    expect(run(new AutoShift(), R, R, 11)[10]).toBe(1);
  });

  it('restarts the charge after a release', () => {
    const shift = new AutoShift();
    run(shift, L, L, 12);
    expect(shift.step(0, 0)).toBe(0);
    expect(run(shift, L, L, 11)).toEqual([-1, 0, 0, 0, 0, 0, 0, 0, 0, 0, -1]);
  });

  it('switches to a newly pressed opposite direction with a fresh charge', () => {
    const shift = new AutoShift();
    run(shift, L, L, 12);
    expect(shift.step(L | R, R)).toBe(1);
    expect(run(shift, L | R, 0, 10)[9]).toBe(1);
  });

  it('resumes the other held direction, charge restarted and without an initial move, after a release', () => {
    const shift = new AutoShift();
    run(shift, L, L, 3);
    shift.step(L | R, R);
    expect(shift.step(L, 0)).toBe(0);
    const out = run(shift, L, 0, 10);
    expect(out[9]).toBe(-1);
    expect(out.slice(0, 9)).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('ignores both directions pressed on the same step', () => {
    expect(new AutoShift().step(L | R, L | R)).toBe(0);
  });

  it('does not move while both directions are held with no direction in charge', () => {
    expect(run(new AutoShift(), L | R, 0, 12)).toEqual(new Array(12).fill(0));
  });
});
