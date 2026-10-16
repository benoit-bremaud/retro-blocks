import { BOARD_WIDTH, VISIBLE_ROWS } from '../domain/board-size';

// Placeholder composition root (toolchain brick): proves the build pipeline end to end.
// Replaced by the real wiring in brick 5 (engine and render).
const canvas = document.querySelector<HTMLCanvasElement>('#screen');
const context = canvas?.getContext('2d');
if (canvas && context) {
  const cell = canvas.width / BOARD_WIDTH;
  context.fillStyle = '#111';
  context.fillRect(0, 0, canvas.width, cell * VISIBLE_ROWS);
}
