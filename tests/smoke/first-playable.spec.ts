import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

// The browser smoke test (ADR-0003) against the built bundle, in Chromium, Firefox and WebKit: the
// game boots without errors, a hard drop locks a piece on the floor, pause dims the field and
// resumes, and a stack to the ceiling ends the run until Enter starts a new one. It reads canvas
// pixels only: no test hook in the game.

// Logical geometry (src/domain/presentation/layout.ts): the field starts at x 80, its bottom row
// (row 0) has its top edge at y 336, a cell is 16 px.
const FIELD_X = 80;
const BOTTOM_ROW_Y = 336;
const CELL = 16;
/** An empty cell is the near-black field colour, and the ghost piece a translucent grey over it: neither is saturated. */
const MAX_GREY_SPREAD = 10;

/** The colours at the middle of the ten cells of the bottom row (device pixels read through the canvas scale). */
async function bottomRow(page: Page): Promise<number[][]> {
  return page.evaluate(
    ({ fieldX, rowY, cell }) => {
      const canvas = document.querySelector<HTMLCanvasElement>('#screen');
      const context = canvas?.getContext('2d');
      if (!canvas || !context) throw new Error('no canvas');
      const scale = canvas.width / 320;
      const colours: number[][] = [];
      for (let column = 0; column < 10; column += 1) {
        const x = (fieldX + column * cell + cell / 2) * scale;
        const y = (rowY + cell / 2) * scale;
        colours.push(Array.from(context.getImageData(x, y, 1, 1).data).slice(0, 3));
      }
      return colours;
    },
    { fieldX: FIELD_X, rowY: BOTTOM_ROW_Y, cell: CELL },
  );
}

/** A locked cell has a saturated piece colour: its channels differ widely. */
const isLocked = (colour: number[]): boolean =>
  Math.max(...colour) - Math.min(...colour) > MAX_GREY_SPREAD;

async function lockedCells(page: Page): Promise<number> {
  return (await bottomRow(page)).filter(isLocked).length;
}

/** Presses a key and lets a few frames pass, so the loop reads it. */
async function tap(page: Page, key: string): Promise<void> {
  await page.keyboard.press(key);
  await page.waitForTimeout(60);
}

test('boots, plays a drop, pauses, tops out and restarts', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.setViewportSize({ width: 800, height: 900 });
  await page.goto('/');
  await page.waitForTimeout(300);

  // Booted: the canvas is drawn at an integer scale and the floor holds no locked cell.
  const size = await page.evaluate(() => {
    const canvas = document.querySelector<HTMLCanvasElement>('#screen');
    return { width: canvas?.width ?? 0, height: canvas?.height ?? 0 };
  });
  expect(size.width % 320).toBe(0);
  expect(size.width).toBeGreaterThanOrEqual(320);
  expect(await lockedCells(page)).toBe(0);

  // A hard drop locks the first piece on the floor.
  await tap(page, 'Space');
  const locked = await lockedCells(page);
  expect(locked).toBeGreaterThanOrEqual(1);
  expect(locked).toBeLessThanOrEqual(4);

  // Pause dims the field; the same key resumes it.
  const before = await bottomRow(page);
  await tap(page, 'KeyP');
  const paused = await bottomRow(page);
  expect(paused).not.toEqual(before);
  await tap(page, 'KeyP');
  expect(await bottomRow(page)).toEqual(before);

  // Pieces dropped at the spawn column pile up without ever completing a row, until top-out.
  for (let i = 0; i < 30; i += 1) await tap(page, 'Space');
  const over = await bottomRow(page);
  expect(over).not.toEqual(before);

  // Enter starts a new run: the floor is empty again.
  await tap(page, 'Enter');
  expect(await lockedCells(page)).toBe(0);

  expect(errors).toEqual([]);
});
