import { FONT, type RenderPort } from '../ports/render-port';
import { SCREEN_WIDTH } from './layout';

/** Pixel width of `text` in the bitmap font at `scale`. */
export function textWidth(text: string, scale: number): number {
  return text.length * (FONT.glyphWidth + FONT.advance) * scale - FONT.advance * scale;
}

function drawCentredAt(
  port: RenderPort,
  text: string,
  centre: number,
  y: number,
  scale: number,
  colour: string,
): void {
  port.drawText(text, centre - textWidth(text, scale) / 2, y, scale, colour);
}

/** Draws `text` centred on the whole logical screen. */
export function drawCentred(
  port: RenderPort,
  text: string,
  y: number,
  scale: number,
  colour: string,
): void {
  drawCentredAt(port, text, SCREEN_WIDTH / 2, y, scale, colour);
}
