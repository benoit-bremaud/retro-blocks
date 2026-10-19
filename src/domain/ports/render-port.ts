/** Drawing surface of the game (UML system/03-class-engine). Text is limited to digits, `A`–`Z`, `-` and the space. */
export interface RenderPort {
  /** Fills the whole logical screen with `colour`. */
  clear(colour: string): void;
  /** Fills a rectangle; coordinates are logical pixels from the top-left, the adapter applies the integer scale. */
  fillRect(x: number, y: number, width: number, height: number, colour: string): void;
  /** Draws `text` in the 3 × 5 bitmap font at `scale` logical pixels per font pixel; `(x, y)` is the top-left. */
  drawText(text: string, x: number, y: number, scale: number, colour: string): void;
}

/** Metrics of the 3 × 5 bitmap font, in font pixels: the presenter lays text out with them, every adapter honours them. */
export const FONT = { glyphWidth: 3, glyphHeight: 5, advance: 1 } as const;
