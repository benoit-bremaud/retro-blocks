import { describe, expect, it } from 'vitest';
import { glyph } from '../../src/adapters/bitmap-font';

describe('bitmap font', () => {
  it('covers digits, A-Z, the dash and the space, and nothing else', () => {
    for (let code = 0x30; code <= 0x39; code += 1) expect(glyph(code)).toHaveLength(5);
    for (let code = 0x41; code <= 0x5a; code += 1) expect(glyph(code)).toHaveLength(5);
    expect(glyph(0x2d)).toHaveLength(5);
    expect(glyph(0x20)?.every((row) => row === 0)).toBe(true);
    expect(glyph(0x61)).toBeUndefined();
    expect(glyph(0x21)).toBeUndefined();
  });

  it('draws known glyphs as 3 × 5 bit rows, most significant bit on the left', () => {
    expect(glyph(0x30)).toEqual([0b111, 0b101, 0b101, 0b101, 0b111]);
    expect(glyph(0x41)).toEqual([0b010, 0b101, 0b111, 0b101, 0b101]);
    expect(glyph(0x2d)).toEqual([0b000, 0b000, 0b111, 0b000, 0b000]);
  });
});
