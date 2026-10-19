import { Intent, type IntentFrame } from '../ports/input-port';
import type { RenderPort } from '../ports/render-port';
import { SCREEN_HEIGHT } from '../presentation/layout';
import { Palette } from '../presentation/palette';
import { drawCentred, textWidth } from '../presentation/text-layout';
import type { Scene, SceneContext, SceneId } from './scene';

const TARGETS: readonly SceneId[] = ['Run', 'HallOfFame', 'Settings'];
const ITEM_TOP = 150;
const ITEM_GAP = 28;

/** Moves a cursor over `count` rows with the up and down intents, wrapping around. */
export function moveCursor(cursor: number, frame: IntentFrame, count: number): number {
  if ((frame.pressed & Intent.SoftDrop) !== 0) return (cursor + 1) % count;
  if ((frame.pressed & Intent.RotateCw) !== 0) return (cursor + count - 1) % count;
  return cursor;
}

/** Title screen: START, HALL OF FAME, SETTINGS. */
export class MenuScene implements Scene {
  private cursor = 0;
  private readonly context: SceneContext;
  private readonly port: RenderPort;

  constructor(context: SceneContext, port: RenderPort) {
    this.context = context;
    this.port = port;
  }

  enter(): void {
    // The cursor stays where the player left it.
  }

  step(frame: IntentFrame): SceneId | null {
    this.cursor = moveCursor(this.cursor, frame, TARGETS.length);
    if ((frame.pressed & Intent.Confirm) === 0) return null;
    return TARGETS[this.cursor] ?? null;
  }

  render(): void {
    const { text } = this.context;
    const labels = [text.start, text.scores, text.settings];
    this.port.clear(Palette.background);
    drawCentred(this.port, text.title, 56, 4, Palette.text);
    for (let i = 0; i < labels.length; i += 1) {
      const label = labels[i] ?? '';
      const y = ITEM_TOP + i * ITEM_GAP;
      const selected = i === this.cursor;
      drawCentred(this.port, label, y, 2, selected ? Palette.text : Palette.textDim);
      if (selected) {
        const x = 160 - textWidth(label, 2) / 2 - 14;
        this.port.fillRect(x, y + 2, 8, 8, Palette.flash);
      }
    }
    drawCentred(this.port, text.navigate, SCREEN_HEIGHT - 20, 1, Palette.textDim);
  }
}
