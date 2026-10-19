import { describe, expect, it } from 'vitest';
import { computeViewport } from '../../src/app/viewport';

describe('computeViewport', () => {
  it('picks the largest integer scale that fits', () => {
    const v = computeViewport(320, 352, 1000, 800, 1);
    expect(v.scale).toBe(2);
    expect(v.deviceWidth).toBe(640);
    expect(v.deviceHeight).toBe(704);
  });

  it('is limited by the smaller dimension', () => {
    expect(computeViewport(320, 352, 4000, 720, 1).scale).toBe(2);
    expect(computeViewport(320, 352, 700, 4000, 1).scale).toBe(2);
  });

  it('works in device pixels and reports the CSS size', () => {
    const v = computeViewport(320, 352, 700, 800, 2);
    expect(v.scale).toBe(4);
    expect(v.cssWidth).toBe(640);
    expect(v.cssHeight).toBe(704);
  });

  it('never goes below 1 in a window smaller than the screen', () => {
    expect(computeViewport(320, 352, 100, 100, 1).scale).toBe(1);
  });
});
