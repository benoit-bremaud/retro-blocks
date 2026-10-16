import { describe, expect, it } from 'vitest';
import { BOARD_HEIGHT, BOARD_WIDTH, VISIBLE_ROWS } from '../../src/domain/board-size';

describe('board size', () => {
  it('matches the Guideline buffer of GDD §2', () => {
    expect(BOARD_WIDTH).toBe(10);
    expect(VISIBLE_ROWS).toBe(20);
    expect(BOARD_HEIGHT).toBe(40);
  });
});
