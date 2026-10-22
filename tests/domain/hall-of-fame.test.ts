import { describe, expect, it } from 'vitest';
import { insertScore, qualifies } from '../../src/domain/hall-of-fame';
import { HALL_SIZE, type ScoreEntry } from '../../src/domain/ports/save-port';

const entry = (points: number, name = 'AAA'): ScoreEntry => ({
  name,
  points,
  lines: 1,
  level: 1,
  seed: 7,
});
const full = (): ScoreEntry[] =>
  Array.from({ length: HALL_SIZE }, (_, i) => entry((HALL_SIZE - i) * 100));

describe('hall of fame', () => {
  it('never lets a zero score in', () => {
    expect(qualifies([], 0)).toBe(false);
  });

  it('accepts any positive score while there is room', () => {
    expect(qualifies([entry(900)], 10)).toBe(true);
  });

  it('on a full table needs to beat the last line, not to tie it', () => {
    expect(qualifies(full(), 100)).toBe(false);
    expect(qualifies(full(), 101)).toBe(true);
  });

  it('inserts by points descending, after equal scores', () => {
    const table = [entry(300, 'AAA'), entry(200, 'BBB'), entry(100, 'CCC')];
    expect(insertScore(table, entry(250, 'NEW')).map((e) => e.name)).toEqual([
      'AAA',
      'NEW',
      'BBB',
      'CCC',
    ]);
    expect(insertScore(table, entry(200, 'NEW')).map((e) => e.name)).toEqual([
      'AAA',
      'BBB',
      'NEW',
      'CCC',
    ]);
    expect(insertScore(table, entry(50, 'NEW')).at(-1)?.name).toBe('NEW');
  });

  it('cuts the table to ten lines and does not touch the input', () => {
    const table = full();
    const next = insertScore(table, entry(1100, 'TOP'));
    expect(next).toHaveLength(HALL_SIZE);
    expect(next[0]?.name).toBe('TOP');
    expect(next.at(-1)?.points).toBe(200);
    expect(table).toHaveLength(HALL_SIZE);
  });
});
