import type { RenderPort } from '../domain/ports/render-port';
import { glyph } from './bitmap-font';

const GLYPH_COLUMNS = 3;
const GLYPH_ROWS = 5;

/**
 * Draws the logical screen on a 2D canvas context received from the composition root. The integer
 * scale is a transform, so every logical pixel stays a crisp square (nearest neighbour). Text is
 * drawn glyph pixel by glyph pixel with `fillRect`: no system font, nothing to allocate.
 */
export class CanvasRenderer implements RenderPort {
  private readonly context: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;

  constructor(context: CanvasRenderingContext2D) {
    this.context = context;
  }

  /**
   * Sets the logical size and the integer scale, after the canvas has been resized to
   * `width * scale` × `height * scale` (resizing a canvas resets its transform).
   */
  setScale(width: number, height: number, scale: number): void {
    this.width = width;
    this.height = height;
    this.context.setTransform(scale, 0, 0, scale, 0, 0);
  }

  clear(colour: string): void {
    this.context.fillStyle = colour;
    this.context.fillRect(0, 0, this.width, this.height);
  }

  fillRect(x: number, y: number, width: number, height: number, colour: string): void {
    this.context.fillStyle = colour;
    this.context.fillRect(x, y, width, height);
  }

  /**
   * @throws RangeError on a character outside the glyph set: the presenter only passes digits,
   * `A`–`Z`, `-` and the space.
   */
  drawText(text: string, x: number, y: number, scale: number, colour: string): void {
    this.context.fillStyle = colour;
    for (let i = 0; i < text.length; i += 1) {
      const rows = glyph(text.codePointAt(i) ?? -1);
      if (rows === undefined) throw new RangeError(`drawText: no glyph for "${text.charAt(i)}"`);
      const left = x + i * (GLYPH_COLUMNS + 1) * scale;
      for (let row = 0; row < GLYPH_ROWS; row += 1) {
        const bits = rows[row] ?? 0;
        for (let column = 0; column < GLYPH_COLUMNS; column += 1) {
          if ((bits & (1 << (GLYPH_COLUMNS - 1 - column))) !== 0) {
            this.context.fillRect(left + column * scale, y + row * scale, scale, scale);
          }
        }
      }
    }
  }
}
