import type { MessageSet } from '../i18n/messages';
import { Intent, type IntentFrame } from '../ports/input-port';
import type { RenderPort } from '../ports/render-port';
import { FOOTER_Y, SCREEN_WIDTH } from '../presentation/layout';
import { Palette } from '../presentation/palette';
import { drawCentred, textWidth } from '../presentation/text-layout';
import { moveCursor, type Scene, type SceneContext, type SceneId } from './scene';

const TARGETS: readonly SceneId[] = ['Run', 'HallOfFame', 'Settings'];
const ITEM_TOP = 150;
const ITEM_GAP = 28;

/** Title screen: START, HALL OF FAME, SETTINGS. */
export class MenuScene implements Scene {
  private cursor = 0;
  private labelsFor: MessageSet | null = null;
  private labels: readonly string[] = [];
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
    const labels = this.labelsOf(text);
    this.port.clear(Palette.background);
    drawCentred(this.port, text.title, 56, 4, Palette.text);
    for (let i = 0; i < labels.length; i += 1) {
      const label = labels[i] ?? '';
      const y = ITEM_TOP + i * ITEM_GAP;
      const selected = i === this.cursor;
      drawCentred(this.port, label, y, 2, selected ? Palette.text : Palette.textDim);
      if (selected) {
        const x = SCREEN_WIDTH / 2 - textWidth(label, 2) / 2 - 14;
        this.port.fillRect(x, y + 2, 8, 8, Palette.flash);
      }
    }
    drawCentred(this.port, text.navigate, FOOTER_Y, 1, Palette.textDim);
  }

  /** The three labels, rebuilt only when the language changes (render allocates nothing). */
  private labelsOf(text: MessageSet): readonly string[] {
    if (this.labelsFor !== text) {
      this.labelsFor = text;
      this.labels = [text.start, text.scores, text.settings];
    }
    return this.labels;
  }
}
