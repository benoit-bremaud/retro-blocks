import { Intent, type IntentFrame } from '../ports/input-port';
import type { RenderPort } from '../ports/render-port';
import { Palette } from '../presentation/palette';
import { drawCentred } from '../presentation/text-layout';
import type { Scene, SceneContext, SceneId } from './scene';

const ROW_TOP = 56;
const ROW_GAP = 24;
const ROW_X = 56;

/** The top ten, rank, name and points; Confirm or Esc goes back to the menu. */
export class HallOfFameScene implements Scene {
  private rows: readonly string[] = [];
  private readonly context: SceneContext;
  private readonly port: RenderPort;

  constructor(context: SceneContext, port: RenderPort) {
    this.context = context;
    this.port = port;
  }

  /** Builds the row texts once per visit, so drawing allocates nothing. */
  enter(): void {
    this.rows = this.context.scores.map(
      (entry, index) =>
        `${String(index + 1).padStart(2, ' ')} ${entry.name} ${String(entry.points).padStart(8, ' ')}`,
    );
  }

  step(frame: IntentFrame): SceneId | null {
    return (frame.pressed & (Intent.Confirm | Intent.Pause)) !== 0 ? 'Menu' : null;
  }

  render(): void {
    const { text } = this.context;
    this.port.clear(Palette.background);
    drawCentred(this.port, text.hallOfFame, 24, 2, Palette.text);
    if (this.rows.length === 0) drawCentred(this.port, text.noScores, 150, 1, Palette.textDim);
    for (let i = 0; i < this.rows.length; i += 1)
      this.port.drawText(this.rows[i] ?? '', ROW_X, ROW_TOP + i * ROW_GAP, 2, Palette.text);
    drawCentred(this.port, text.pressEnter, 330, 1, Palette.textDim);
  }
}
