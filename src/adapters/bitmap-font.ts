/**
 * Glyphs of the 3 × 5 bitmap font (RenderPort contract), copied from retro-shmup (ADR-0002, source SHA
 * f698786): each row is a 3-bit mask, most significant bit on the left. The set is digits, `A`–`Z`,
 * `-` and the space.
 */
const DIGITS: readonly (readonly number[])[] = [
  [0b111, 0b101, 0b101, 0b101, 0b111],
  [0b010, 0b110, 0b010, 0b010, 0b111],
  [0b111, 0b001, 0b111, 0b100, 0b111],
  [0b111, 0b001, 0b111, 0b001, 0b111],
  [0b101, 0b101, 0b111, 0b001, 0b001],
  [0b111, 0b100, 0b111, 0b001, 0b111],
  [0b111, 0b100, 0b111, 0b101, 0b111],
  [0b111, 0b001, 0b001, 0b001, 0b001],
  [0b111, 0b101, 0b111, 0b101, 0b111],
  [0b111, 0b101, 0b111, 0b001, 0b111],
];
const LETTERS: readonly (readonly number[])[] = [
  [0b010, 0b101, 0b111, 0b101, 0b101], // A
  [0b110, 0b101, 0b110, 0b101, 0b110], // B
  [0b011, 0b100, 0b100, 0b100, 0b011], // C
  [0b110, 0b101, 0b101, 0b101, 0b110], // D
  [0b111, 0b100, 0b110, 0b100, 0b111], // E
  [0b111, 0b100, 0b110, 0b100, 0b100], // F
  [0b011, 0b100, 0b101, 0b101, 0b011], // G
  [0b101, 0b101, 0b111, 0b101, 0b101], // H
  [0b111, 0b010, 0b010, 0b010, 0b111], // I
  [0b001, 0b001, 0b001, 0b101, 0b010], // J
  [0b101, 0b101, 0b110, 0b101, 0b101], // K
  [0b100, 0b100, 0b100, 0b100, 0b111], // L
  [0b101, 0b111, 0b111, 0b101, 0b101], // M
  [0b110, 0b101, 0b101, 0b101, 0b101], // N
  [0b010, 0b101, 0b101, 0b101, 0b010], // O
  [0b110, 0b101, 0b110, 0b100, 0b100], // P
  [0b010, 0b101, 0b101, 0b110, 0b011], // Q
  [0b110, 0b101, 0b110, 0b101, 0b101], // R
  [0b011, 0b100, 0b010, 0b001, 0b110], // S
  [0b111, 0b010, 0b010, 0b010, 0b010], // T
  [0b101, 0b101, 0b101, 0b101, 0b111], // U
  [0b101, 0b101, 0b101, 0b101, 0b010], // V
  [0b101, 0b101, 0b111, 0b111, 0b101], // W
  [0b101, 0b101, 0b010, 0b101, 0b101], // X
  [0b101, 0b101, 0b010, 0b010, 0b010], // Y
  [0b111, 0b001, 0b010, 0b100, 0b111], // Z
];
const SPACE_GLYPH: readonly number[] = [0, 0, 0, 0, 0];
const DASH_GLYPH: readonly number[] = [0b000, 0b000, 0b111, 0b000, 0b000];

const ZERO = 0x30;
const NINE = 0x39;
const DASH = 0x2d;
const SPACE = 0x20;
const LETTER_A = 0x41;
const LETTER_Z = 0x5a;

/** The rows of a glyph for a code point, or `undefined` outside the set. */
export function glyph(code: number): readonly number[] | undefined {
  if (code >= ZERO && code <= NINE) return DIGITS[code - ZERO];
  if (code >= LETTER_A && code <= LETTER_Z) return LETTERS[code - LETTER_A];
  if (code === DASH) return DASH_GLYPH;
  return code === SPACE ? SPACE_GLYPH : undefined;
}
