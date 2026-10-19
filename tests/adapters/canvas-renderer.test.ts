import { describe, expect, it } from 'vitest';
import { CanvasRenderer } from '../../src/adapters/canvas-renderer';

interface Fill {
  readonly style: string;
  readonly rect: readonly number[];
}

/** A canvas context double that records fills and transforms: the adapter's only boundary. */
function fakeContext(): {
  context: CanvasRenderingContext2D;
  fills: Fill[];
  transforms: number[][];
} {
  const fills: Fill[] = [];
  const transforms: number[][] = [];
  const state = { fillStyle: '' };
  const context = {
    get fillStyle() {
      return state.fillStyle;
    },
    set fillStyle(value: string) {
      state.fillStyle = value;
    },
    fillRect: (...rect: number[]) => fills.push({ style: state.fillStyle, rect }),
    setTransform: (...matrix: number[]) => transforms.push(matrix),
  } as unknown as CanvasRenderingContext2D;
  return { context, fills, transforms };
}

describe('CanvasRenderer', () => {
  it('applies the integer scale as a transform and clears the logical screen', () => {
    const { context, fills, transforms } = fakeContext();
    const renderer = new CanvasRenderer(context);
    renderer.setScale(320, 352, 3);
    renderer.clear('#123456');
    expect(transforms).toEqual([[3, 0, 0, 3, 0, 0]]);
    expect(fills).toEqual([{ style: '#123456', rect: [0, 0, 320, 352] }]);
  });

  it('fills a rectangle in the given colour', () => {
    const { context, fills } = fakeContext();
    new CanvasRenderer(context).fillRect(1, 2, 3, 4, '#abcdef');
    expect(fills).toEqual([{ style: '#abcdef', rect: [1, 2, 3, 4] }]);
  });

  it('draws text glyph pixel by glyph pixel at the font scale', () => {
    const { context, fills } = fakeContext();
    new CanvasRenderer(context).drawText('1', 10, 20, 2, '#fff');
    // "1" is 010 / 110 / 010 / 010 / 111: 8 lit pixels, each a 2 × 2 square.
    expect(fills).toHaveLength(8);
    expect(fills[0]).toEqual({ style: '#fff', rect: [12, 20, 2, 2] });
    expect(fills.every((f) => f.rect[2] === 2 && f.rect[3] === 2)).toBe(true);
  });

  it('advances 4 font pixels per character and draws nothing for a space', () => {
    const { context, fills } = fakeContext();
    new CanvasRenderer(context).drawText(' 1', 0, 0, 1, '#fff');
    // Only the "1" is drawn (8 lit pixels), one advance of 4 to the right; its first lit pixel is column 1.
    expect(fills).toHaveLength(8);
    expect(fills[0]?.rect[0]).toBe(4 + 1);
  });

  it('rejects a character outside the font', () => {
    const { context } = fakeContext();
    expect(() => {
      new CanvasRenderer(context).drawText('a', 0, 0, 1, '#fff');
    }).toThrow(RangeError);
  });
});
