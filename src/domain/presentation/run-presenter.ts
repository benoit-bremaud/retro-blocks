import type { AudioPort, SfxId } from '../ports/audio-port';
import type { MessageSet } from '../i18n/messages';
import type { RenderPort } from '../ports/render-port';
import { BOARD_WIDTH } from '../board-size';
import { cellCode, type PieceKind } from '../piece-kind';
import { shape } from '../srs';
import type { StepOutcome, SimView } from '../simulation';
import {
  CELL,
  DRAWN_ROWS,
  FIELD_HEIGHT,
  FIELD_WIDTH,
  FIELD_X,
  FIELD_Y,
  MINI_CELL,
  rowTop,
} from './layout';
import { Palette } from './palette';
import { textWidth } from './text-layout';

/** Which scene is drawn; the scene machine owns the transitions (UML gameplay/02-state). */
export type SceneKind = 'Run' | 'Paused' | 'GameOver';

const CLEAR_SFX: readonly SfxId[] = ['clear1', 'clear1', 'clear2', 'clear3', 'clear4'];
// The cleared rows blink: white for 4 steps, then the rows again for 4 steps.
const FLASH_PERIOD_STEPS = 4;
const LEFT_PANEL_X = 8;
const RIGHT_PANEL_X = FIELD_X + FIELD_WIDTH + 8;
const PREVIEW_SLOT = 3 * MINI_CELL + 8;
const NEXT_TOP = 56;
const HOLD_TOP = 56;
const BOX_WIDTH = 4 * MINI_CELL;

interface Bounds {
  readonly minX: number;
  readonly minY: number;
  readonly width: number;
  readonly height: number;
}

// Bounding box of each kind's spawn rotation, so a preview can be centred; built once.
const BOUNDS: Readonly<Record<PieceKind, Bounds>> = {
  I: boundsOf('I'),
  O: boundsOf('O'),
  T: boundsOf('T'),
  S: boundsOf('S'),
  Z: boundsOf('Z'),
  J: boundsOf('J'),
  L: boundsOf('L'),
};

function boundsOf(kind: PieceKind): Bounds {
  const s = shape(kind, 0);
  const xs = [s[0].x, s[1].x, s[2].x, s[3].x];
  const ys = [s[0].y, s[1].y, s[2].y, s[3].y];
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return { minX, minY, width: Math.max(...xs) - minX + 1, height: Math.max(...ys) - minY + 1 };
}

/**
 * Turns a `SimView` into draw calls and a `StepOutcome` into sounds (UML system/03-class-engine).
 * Draw calls allocate nothing: index loops, and the numbers of the panel are converted to text
 * only when they change.
 */
export class RunPresenter {
  private points = -1;
  private level = -1;
  private lines = -1;
  private pointsText = '';
  private levelText = '';
  private linesText = '';

  /** Plays the sound of what a step did: a top-out, a clear (by row count), a spin or a plain lock. */
  announce(outcome: StepOutcome, audio: AudioPort): void {
    if (outcome.toppedOut) audio.play('gameOver');
    else if (outcome.locked) audio.play(this.lockSfx(outcome));
  }

  private lockSfx(outcome: StepOutcome): SfxId {
    const rows = outcome.clearedRows.length;
    if (rows > 0) return CLEAR_SFX[rows] ?? 'clear4';
    return outcome.spin === 'None' ? 'lock' : 'spin';
  }

  /** Draws the whole logical screen. While Clearing, `active` is already part of the cells: it is not drawn again. */
  draw(view: SimView, scene: SceneKind, port: RenderPort, text: MessageSet): void {
    port.clear(Palette.background);
    this.drawField(view, port);
    this.drawPanels(view, port, text);
    if (scene === 'Paused') drawOverlay(port, text.paused, text.pressP);
    else if (scene === 'GameOver') drawOverlay(port, text.gameOver, text.pressEnter, text.escMenu);
  }

  private drawField(view: SimView, port: RenderPort): void {
    port.fillRect(FIELD_X, 0, FIELD_WIDTH, FIELD_Y, Palette.margin);
    port.fillRect(FIELD_X, FIELD_Y, FIELD_WIDTH, FIELD_HEIGHT, Palette.field);
    for (let x = 1; x < BOARD_WIDTH; x += 1)
      port.fillRect(FIELD_X + x * CELL, FIELD_Y, 1, FIELD_HEIGHT, Palette.grid);
    for (let y = 0; y < DRAWN_ROWS; y += 1) {
      for (let x = 0; x < BOARD_WIDTH; x += 1) {
        const code = view.cells.cellAt(x, y);
        if (code !== 0) drawCell(port, FIELD_X + x * CELL, rowTop(y), CELL, code);
      }
    }
    if (view.phase === 'Falling') this.drawActive(view, port);
    else this.drawFlash(view, port);
  }

  private drawActive(view: SimView, port: RenderPort): void {
    const { kind, rotation, x, y } = view.active;
    const s = shape(kind, rotation);
    const code = cellCode(kind);
    if (view.ghostY !== y) {
      for (let i = 0; i < 4; i += 1) {
        const cell = s[i];
        if (cell === undefined) continue;
        port.fillRect(
          FIELD_X + (x + cell.x) * CELL,
          rowTop(view.ghostY + cell.y),
          CELL,
          CELL,
          Palette.ghost,
        );
      }
    }
    for (let i = 0; i < 4; i += 1) {
      const cell = s[i];
      if (cell === undefined) continue;
      drawCell(port, FIELD_X + (x + cell.x) * CELL, rowTop(y + cell.y), CELL, code);
    }
  }

  private drawFlash(view: SimView, port: RenderPort): void {
    if (Math.floor(view.clearFrames / FLASH_PERIOD_STEPS) % 2 !== 0) return;
    for (let i = 0; i < view.clearingRows.length; i += 1) {
      const row = view.clearingRows[i];
      if (row !== undefined) port.fillRect(FIELD_X, rowTop(row), FIELD_WIDTH, CELL, Palette.flash);
    }
  }

  private drawPanels(view: SimView, port: RenderPort, text: MessageSet): void {
    this.refreshText(view);
    port.drawText(text.hold, LEFT_PANEL_X, 40, 2, Palette.text);
    port.fillRect(LEFT_PANEL_X, HOLD_TOP, BOX_WIDTH + 16, PREVIEW_SLOT, Palette.panel);
    if (view.held !== null) drawPreview(port, view.held, LEFT_PANEL_X + 8, HOLD_TOP + 4);
    port.drawText(text.score, LEFT_PANEL_X, 144, 1, Palette.textDim);
    port.drawText(this.pointsText, LEFT_PANEL_X, 154, 2, Palette.text);
    port.drawText(text.level, LEFT_PANEL_X, 186, 1, Palette.textDim);
    port.drawText(this.levelText, LEFT_PANEL_X, 196, 2, Palette.text);
    port.drawText(text.lines, LEFT_PANEL_X, 228, 1, Palette.textDim);
    port.drawText(this.linesText, LEFT_PANEL_X, 238, 2, Palette.text);
    port.drawText(text.next, RIGHT_PANEL_X, 40, 2, Palette.text);
    for (let i = 0; i < view.next.length; i += 1) {
      const kind = view.next[i];
      const top = NEXT_TOP + i * PREVIEW_SLOT;
      port.fillRect(RIGHT_PANEL_X, top, BOX_WIDTH + 16, PREVIEW_SLOT - 4, Palette.panel);
      if (kind !== undefined) drawPreview(port, kind, RIGHT_PANEL_X + 8, top + 2);
    }
  }

  private refreshText(view: SimView): void {
    if (view.points !== this.points) {
      this.points = view.points;
      this.pointsText = String(view.points);
    }
    if (view.level !== this.level) {
      this.level = view.level;
      this.levelText = String(view.level);
    }
    if (view.lines !== this.lines) {
      this.lines = view.lines;
      this.linesText = String(view.lines);
    }
  }
}

/** One cell: base colour, a light edge on top and left, a shade on the bottom and right. */
function drawCell(port: RenderPort, px: number, py: number, size: number, code: number): void {
  port.fillRect(px, py, size, size, Palette.cell[code] ?? Palette.flash);
  port.fillRect(px, py, size, 1, Palette.cellLight[code] ?? Palette.flash);
  port.fillRect(px, py, 1, size, Palette.cellLight[code] ?? Palette.flash);
  port.fillRect(px, py + size - 1, size, 1, Palette.shade);
  port.fillRect(px + size - 1, py, 1, size, Palette.shade);
}

/** A piece in spawn rotation, centred in a 4 × 3 mini-cell box whose top-left is (x, y). */
function drawPreview(port: RenderPort, kind: PieceKind, x: number, y: number): void {
  const b = BOUNDS[kind];
  const s = shape(kind, 0);
  const left = x + Math.floor((BOX_WIDTH - b.width * MINI_CELL) / 2);
  const top = y + Math.floor((3 * MINI_CELL - b.height * MINI_CELL) / 2);
  const code = cellCode(kind);
  for (let i = 0; i < 4; i += 1) {
    const cell = s[i];
    if (cell === undefined) continue;
    const px = left + (cell.x - b.minX) * MINI_CELL;
    const py = top + (b.minY + b.height - 1 - cell.y) * MINI_CELL;
    drawCell(port, px, py, MINI_CELL, code);
  }
}

function drawOverlay(port: RenderPort, title: string, hint: string, extra = ''): void {
  port.fillRect(FIELD_X, FIELD_Y, FIELD_WIDTH, FIELD_HEIGHT, Palette.overlay);
  const centre = FIELD_X + FIELD_WIDTH / 2;
  port.drawText(
    title,
    centre - textWidth(title, 2) / 2,
    FIELD_Y + FIELD_HEIGHT / 2 - 12,
    2,
    Palette.text,
  );
  port.drawText(
    hint,
    centre - textWidth(hint, 1) / 2,
    FIELD_Y + FIELD_HEIGHT / 2 + 8,
    1,
    Palette.textDim,
  );
  if (extra !== '') {
    port.drawText(
      extra,
      centre - textWidth(extra, 1) / 2,
      FIELD_Y + FIELD_HEIGHT / 2 + 20,
      1,
      Palette.textDim,
    );
  }
}
