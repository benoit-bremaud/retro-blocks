import { LANGUAGES } from '../i18n/messages';
import { Intent, type IntentFrame } from '../ports/input-port';
import type { RenderPort } from '../ports/render-port';
import { VOLUME_MAX, type Language } from '../ports/save-port';
import { Palette } from '../presentation/palette';
import { drawCentred } from '../presentation/text-layout';
import { moveCursor } from './menu-scene';
import type { Scene, SceneContext, SceneId } from './scene';

const ROWS = 4;
const BACK_ROW = 3;
const ROW_TOP = 90;
const ROW_GAP = 30;
const LABEL_X = 40;
const VALUE_X = 190;

/** Settings: language, volume, sound on or off. Every change is applied and saved at once. */
export class SettingsScene implements Scene {
  private cursor = 0;
  private readonly context: SceneContext;
  private readonly port: RenderPort;

  constructor(context: SceneContext, port: RenderPort) {
    this.context = context;
    this.port = port;
  }

  enter(): void {
    this.cursor = 0;
  }

  step(frame: IntentFrame): SceneId | null {
    if ((frame.pressed & Intent.Pause) !== 0) return 'Menu';
    this.cursor = moveCursor(this.cursor, frame, ROWS);
    if (this.cursor === BACK_ROW) return (frame.pressed & Intent.Confirm) !== 0 ? 'Menu' : null;
    const delta = this.direction(frame);
    if (delta !== 0) this.change(delta);
    return null;
  }

  render(): void {
    const { text, settings } = this.context;
    const rows: readonly (readonly [string, string])[] = [
      [text.language, text.languageName],
      [text.volume, String(settings.volume)],
      [text.sound, settings.muted ? text.off : text.on],
      [text.back, ''],
    ];
    this.port.clear(Palette.background);
    drawCentred(this.port, text.settings, 30, 3, Palette.text);
    for (let i = 0; i < rows.length; i += 1) {
      const [label, value] = rows[i] ?? ['', ''];
      const y = ROW_TOP + i * ROW_GAP;
      const colour = i === this.cursor ? Palette.text : Palette.textDim;
      this.port.drawText(label, LABEL_X, y, 2, colour);
      this.port.drawText(value, VALUE_X, y, 2, colour);
      if (i === this.cursor) this.port.fillRect(LABEL_X - 14, y + 2, 8, 8, Palette.flash);
    }
    drawCentred(this.port, text.navigate, 330, 1, Palette.textDim);
  }

  /** -1 for Left, +1 for Right or Confirm (so one key cycles a value), 0 for neither. */
  private direction(frame: IntentFrame): number {
    if ((frame.pressed & Intent.Left) !== 0) return -1;
    if ((frame.pressed & (Intent.Right | Intent.Confirm)) !== 0) return 1;
    return 0;
  }

  private change(delta: number): void {
    const { settings } = this.context;
    if (this.cursor === 0) {
      const index = LANGUAGES.indexOf(settings.language) + delta + LANGUAGES.length;
      const language: Language = LANGUAGES[index % LANGUAGES.length] ?? settings.language;
      this.context.updateSettings({ ...settings, language });
    } else if (this.cursor === 1) {
      const volume = Math.min(VOLUME_MAX, Math.max(0, settings.volume + delta));
      this.context.updateSettings({ ...settings, volume });
    } else {
      this.context.updateSettings({ ...settings, muted: !settings.muted });
    }
  }
}
