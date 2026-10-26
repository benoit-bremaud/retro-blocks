import { describe, expect, it } from 'vitest';
import { Scoring } from '../../src/domain/scoring';
import type { SpinKind } from '../../src/domain/spin-kind';

function award(rows: number, spin: SpinKind = 'None', level = 1): Scoring {
  const score = new Scoring(level);
  score.award(rows, spin);
  return score;
}

describe('Scoring', () => {
  it('starts at the given level with no lines and no points', () => {
    const score = new Scoring(3);
    expect([score.level, score.lines, score.points]).toEqual([3, 0, 0]);
  });

  it.each([
    [1, 100],
    [2, 300],
    [3, 500],
    [4, 800],
  ])('%i line(s) score %i at level 1', (rows, points) => {
    expect(award(rows).points).toBe(points);
  });

  it('multiplies by the level', () => {
    expect(award(2, 'None', 5).points).toBe(1500);
  });

  it.each([
    [0, 100],
    [1, 200],
    [2, 400],
  ])('T-spin Mini with %i line(s) scores %i', (rows, points) => {
    expect(award(rows, 'Mini').points).toBe(points);
  });

  it.each([
    [0, 400],
    [1, 800],
    [2, 1200],
    [3, 1600],
  ])('T-spin with %i line(s) scores %i', (rows, points) => {
    expect(award(rows, 'Full').points).toBe(points);
  });

  it('scores a Mini with three lines as a full T-spin Triple (cannot occur, guarded)', () => {
    expect(award(3, 'Mini').points).toBe(1600);
  });

  it('counts lines and levels up every 10 lines', () => {
    const score = new Scoring(1);
    for (let i = 0; i < 4; i += 1) score.award(2, 'None');
    expect([score.lines, score.level]).toEqual([8, 1]);
    score.award(2, 'None');
    expect([score.lines, score.level]).toEqual([10, 2]);
  });

  it('levels up from the start level', () => {
    const score = new Scoring(4);
    score.award(4, 'None');
    score.award(4, 'None');
    score.award(2, 'None');
    expect(score.level).toBe(5);
  });

  it('scores a clear with the level before the level-up it causes', () => {
    const score = new Scoring(1);
    for (let i = 0; i < 4; i += 1) score.award(2, 'None');
    const before = score.points;
    score.award(2, 'None');
    expect(score.points - before).toBe(300 + 50 * 3);
  });

  it('combo starts at 0 on the second consecutive clearing lock, then +50 per step × level', () => {
    const score = new Scoring(2);
    score.award(1, 'None');
    expect(score.points).toBe(200);
    score.award(1, 'None');
    expect(score.points).toBe(200 + 200 + 0);
    score.award(1, 'None');
    expect(score.points).toBe(400 + 200 + 50 * 1 * 2);
  });

  it.each([
    ['a lock without lines resets the combo', [1, 1, 0], [1, 1], 200],
    ['back-to-back: a second four-line clear is ×1.5', [4, 0], [4], 1200],
    ['a single, double or triple without a spin breaks the chain', [4, 1, 0], [4], 800],
  ])('%s', (_name, setup: number[], scored: number[], expected: number) => {
    const score = new Scoring(1);
    for (const rows of setup) score.award(rows, 'None');
    const before = score.points;
    for (const rows of scored) score.award(rows, 'None');
    expect(score.points - before).toBe(expected);
  });

  it('back-to-back applies to a T-spin clear after a four-line clear, not to the combo', () => {
    const score = new Scoring(1);
    score.award(4, 'None');
    const before = score.points;
    score.award(2, 'Full');
    expect(score.points - before).toBe(1800 + 50 * 0);
    const mid = score.points;
    score.award(1, 'Full');
    expect(score.points - mid).toBe(1200 + 50 * 1);
  });

  it('a spin with no lines does not break the chain, and is not back-to-back itself', () => {
    const score = new Scoring(1);
    score.award(4, 'None');
    score.award(0, 'Full');
    const spinPoints = score.points;
    expect(spinPoints).toBe(800 + 400);
    score.award(4, 'None');
    expect(score.points - spinPoints).toBe(1200);
  });

  it('a first difficult clear is not back-to-back', () => {
    expect(award(4).points).toBe(800);
  });

  it('a Mini with lines is a difficult clear: it starts and keeps a back-to-back chain', () => {
    const score = new Scoring(1);
    score.award(4, 'None');
    const before = score.points;
    score.award(1, 'Mini');
    expect(score.points - before).toBe(300);
  });

  it('a zero-line Mini does not break the chain', () => {
    const score = new Scoring(1);
    score.award(4, 'None');
    score.award(0, 'Mini');
    const before = score.points;
    score.award(4, 'None');
    expect(score.points - before).toBe(1200);
  });

  it('back-to-back multiplies the base by the level too', () => {
    const score = new Scoring(3);
    score.award(4, 'None');
    score.award(0, 'None');
    const before = score.points;
    score.award(4, 'None');
    expect(score.points - before).toBe(3600);
  });

  it('adds soft and hard drop points, not multiplied by the level', () => {
    const score = new Scoring(9);
    score.addSoftDrop(5);
    score.addHardDrop(7);
    expect(score.points).toBe(5 + 14);
  });
});
