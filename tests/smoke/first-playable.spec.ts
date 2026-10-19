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

/**
 * Presses a key, then waits for two animation frames so the loop has read it (the page latches a
 * press until the next step, and two presses in one frame would merge): frames, not a sleep.
 */
async function tap(page: Page, key: string): Promise<void> {
  await page.keyboard.press(key);
  await page.evaluate(
    () =>
      new Promise<void>((done) =>
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            done();
          });
        }),
      ),
  );
}

test('boots, plays a drop, pauses, tops out and restarts', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await test.step('boots at an integer scale with an empty floor', async () => {
    await page.setViewportSize({ width: 800, height: 900 });
    await page.goto('/');
    // The first frame has drawn once the field background is on the canvas.
    await expect.poll(() => bottomRow(page)).not.toEqual([]);
    const size = await page.evaluate(() => {
      const canvas = document.querySelector<HTMLCanvasElement>('#screen');
      return { width: canvas?.width ?? 0, height: canvas?.height ?? 0 };
    });
    expect(size.width % 320).toBe(0);
    expect(size.width).toBeGreaterThanOrEqual(320);
    expect(await lockedCells(page)).toBe(0);
  });

  let before: number[][] = [];
  await test.step('a hard drop locks the first piece on the floor', async () => {
    await tap(page, 'Space');
    await expect.poll(() => lockedCells(page)).toBeGreaterThanOrEqual(1);
    expect(await lockedCells(page)).toBeLessThanOrEqual(4);
    before = await bottomRow(page);
  });

  await test.step('pause dims the field and the same key resumes it', async () => {
    await tap(page, 'KeyP');
    await expect.poll(() => bottomRow(page)).not.toEqual(before);
    await tap(page, 'KeyP');
    await expect.poll(() => bottomRow(page)).toEqual(before);
  });

  await test.step('a stack to the ceiling ends the run, and Enter starts a new one', async () => {
    // Pieces dropped at the spawn column pile up without ever completing a row.
    for (let i = 0; i < 30; i += 1) await tap(page, 'Space');
    // The game over overlay dims the stack, so the floor row no longer shows its first colours.
    await expect.poll(() => bottomRow(page)).not.toEqual(before);
    await tap(page, 'Enter');
    await expect.poll(() => lockedCells(page)).toBe(0);
  });

  expect(errors).toEqual([]);
});
