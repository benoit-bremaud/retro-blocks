import type { RenderPort } from '../../src/domain/ports/render-port';

export interface RectCall {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly colour: string;
}

export interface TextCall {
  readonly text: string;
  readonly x: number;
  readonly y: number;
  readonly scale: number;
  readonly colour: string;
}

/** A fake render surface that records every call, so presentation logic is tested without a canvas. */
export class RecordingPort implements RenderPort {
  readonly clears: string[] = [];
  readonly rects: RectCall[] = [];
  readonly texts: TextCall[] = [];

  clear(colour: string): void {
    this.clears.push(colour);
  }

  fillRect(x: number, y: number, width: number, height: number, colour: string): void {
    this.rects.push({ x, y, width, height, colour });
  }

  drawText(text: string, x: number, y: number, scale: number, colour: string): void {
    this.texts.push({ text, x, y, scale, colour });
  }

  /** True when a rectangle of exactly this geometry and colour was filled. */
  hasRect(x: number, y: number, width: number, height: number, colour: string): boolean {
    return this.rects.some(
      (r) =>
        r.x === x && r.y === y && r.width === width && r.height === height && r.colour === colour,
    );
  }

  hasText(text: string): boolean {
    return this.texts.some((t) => t.text === text);
  }
}
