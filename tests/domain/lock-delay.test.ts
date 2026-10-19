import { describe, expect, it } from 'vitest';
import { LockDelay } from '../../src/domain/lock-delay';

function tickMany(lock: LockDelay, grounded: boolean, count: number): boolean[] {
  const out: boolean[] = [];
  for (let i = 0; i < count; i += 1) out.push(lock.tick(grounded));
  return out;
}

describe('LockDelay', () => {
  it('never locks in the air', () => {
    const lock = new LockDelay();
    lock.reset(21);
    expect(tickMany(lock, false, 100).includes(true)).toBe(false);
  });

  it('locks on the 30th grounded step', () => {
    const lock = new LockDelay();
    lock.reset(21);
    const out = tickMany(lock, true, 30);
    expect(out.indexOf(true)).toBe(29);
  });

  it('restarts the countdown when the piece leaves the ground', () => {
    const lock = new LockDelay();
    lock.reset(21);
    tickMany(lock, true, 20);
    lock.tick(false);
    expect(tickMany(lock, true, 30).indexOf(true)).toBe(29);
  });

  it('a grounded move or rotation restarts the countdown', () => {
    const lock = new LockDelay();
    lock.reset(21);
    tickMany(lock, true, 29);
    lock.onMoveOrRotate(true);
    expect(tickMany(lock, true, 30).indexOf(true)).toBe(29);
  });

  it('a move in the air does not count as a reset', () => {
    const lock = new LockDelay();
    lock.reset(21);
    for (let i = 0; i < 40; i += 1) lock.onMoveOrRotate(false);
    expect(tickMany(lock, true, 15).includes(true)).toBe(false);
    lock.onMoveOrRotate(true);
    expect(lock.tick(true)).toBe(false);
  });

  it('stops restarting the countdown once 15 resets are spent', () => {
    const lock = new LockDelay();
    lock.reset(21);
    for (let i = 0; i < 15; i += 1) lock.onMoveOrRotate(true);
    expect(tickMany(lock, true, 10).includes(true)).toBe(false);
    lock.onMoveOrRotate(true);
    expect(tickMany(lock, true, 19).includes(true)).toBe(false);
    expect(lock.tick(true)).toBe(true);
  });

  it('a new lowest row restores the resets as well as the frames', () => {
    const lock = new LockDelay();
    lock.reset(21);
    for (let i = 0; i < 15; i += 1) lock.onMoveOrRotate(true);
    tickMany(lock, true, 25);
    lock.onDescend(20);
    lock.onMoveOrRotate(true);
    expect(tickMany(lock, true, 29).includes(true)).toBe(false);
    expect(lock.tick(true)).toBe(true);
  });

  it('a new lowest row also restores the frames', () => {
    const lock = new LockDelay();
    lock.reset(21);
    tickMany(lock, true, 25);
    lock.onDescend(20);
    expect(tickMany(lock, true, 29).includes(true)).toBe(false);
    expect(lock.tick(true)).toBe(true);
  });

  it('descending to a row that is not a new lowest changes nothing', () => {
    const lock = new LockDelay();
    lock.reset(21);
    lock.onDescend(10);
    for (let i = 0; i < 15; i += 1) lock.onMoveOrRotate(true);
    tickMany(lock, true, 25);
    lock.onDescend(12);
    lock.onMoveOrRotate(true);
    expect(tickMany(lock, true, 4).includes(true)).toBe(false);
    expect(lock.tick(true)).toBe(true);
  });

  it('reset starts a new piece from scratch, forgetting the old lowest row', () => {
    const lock = new LockDelay();
    lock.reset(21);
    lock.onDescend(5);
    lock.reset(21);
    lock.onDescend(10);
    tickMany(lock, true, 20);
    // 9 is a new lowest row only if reset forgot the old one (5): the frames restart.
    lock.onDescend(9);
    expect(tickMany(lock, true, 29).includes(true)).toBe(false);
  });
});
