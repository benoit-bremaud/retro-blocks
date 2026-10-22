import { BOARD_WIDTH, VISIBLE_ROWS } from '../board-size';

/** Side of a playfield cell in logical pixels (UML system/03-class-engine). */
export const CELL = 16;

/** Rows above the visible field drawn as the spawn margin (GDD §2). */
const MARGIN_ROWS = 2;

/** Logical screen: left panel (80) + field (160) + right panel (80), margin + field high. */
export const SCREEN_WIDTH = 320;
export const SCREEN_HEIGHT = (VISIBLE_ROWS + MARGIN_ROWS) * CELL;

/** Top-left corner of the visible field (row 19 is its top row). */
export const FIELD_X = 80;
export const FIELD_Y = MARGIN_ROWS * CELL;
export const FIELD_WIDTH = BOARD_WIDTH * CELL;
/** Rows drawn: the visible field plus the spawn margin. */
export const DRAWN_ROWS = VISIBLE_ROWS + MARGIN_ROWS;
export const FIELD_HEIGHT = VISIBLE_ROWS * CELL;

/** Pixel row of the top edge of board row `y`: rows 20 and 21 lie in the margin above the field. */
export function rowTop(y: number): number {
  return FIELD_Y + (VISIBLE_ROWS - 1 - y) * CELL;
}

/** Side of a preview cell (hold box, next queue). */
export const MINI_CELL = 12;

/** Top of the one-line hint at the bottom of the menu screens. */
export const FOOTER_Y = 330;
