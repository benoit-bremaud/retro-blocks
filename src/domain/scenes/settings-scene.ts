import { LANGUAGES } from '../i18n/messages';
import { Intent, type IntentFrame } from '../ports/input-port';
import type { RenderPort } from '../ports/render-port';
import { VOLUME_MAX, type Language } from '../ports/save-port';
import { Palette } from '../presentation/palette';
import { FOOTER_Y } from '../presentation/layout';
import { drawCentred } from '../presentation/text-layout';
import { moveCursor, type Scene, type SceneContext, type SceneId } from './scene';

const ROWS = 4;
const LANGUAGE_ROW = 0;
const VOLUME_ROW = 1;
const VOLUME_LABELS = ['0', '1', '2', '3'] as const;
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
    if (this.cursor === BACK_ROW) return (frame.pressed & Intent.Confirm) === 0 ? null : 'Menu';
    const delta = this.direction(frame);
    if (delta !== 0) this.change(delta);
    return null;
  }

  render(): void {
    const { text, settings } = this.context;
    this.port.clear(Palette.background);
    drawCentred(this.port, text.settings, 30, 3, Palette.text);
    this.drawRow(0, text.language, text.languageName);
    this.drawRow(1, text.volume, VOLUME_LABELS[settings.volume] ?? '');
    this.drawRow(2, text.sound, settings.muted ? text.off : text.on);
    this.drawRow(BACK_ROW, text.back, '');
    drawCentred(this.port, text.navigate, FOOTER_Y, 1, Palette.textDim);
  }

  private drawRow(index: number, label: string, value: string): void {
    const y = ROW_TOP + index * ROW_GAP;
    const colour = index === this.cursor ? Palette.text : Palette.textDim;
    this.port.drawText(label, LABEL_X, y, 2, colour);
    this.port.drawText(value, VALUE_X, y, 2, colour);
    if (index === this.cursor) this.port.fillRect(LABEL_X - 14, y + 2, 8, 8, Palette.flash);
  }

  /** -1 for Left, +1 for Right or Confirm (Enter steps a value forward; volume stops at its ends, the other rows cycle), 0 for neither. */
  private direction(frame: IntentFrame): number {
    if ((frame.pressed & Intent.Left) !== 0) return -1;
    if ((frame.pressed & (Intent.Right | Intent.Confirm)) !== 0) return 1;
    return 0;
  }

  private change(delta: number): void {
    const { settings } = this.context;
    if (this.cursor === LANGUAGE_ROW) {
      const index = LANGUAGES.indexOf(settings.language) + delta + LANGUAGES.length;
      const language: Language = LANGUAGES[index % LANGUAGES.length] ?? settings.language;
      this.context.updateSettings({ ...settings, language });
    } else if (this.cursor === VOLUME_ROW) {
      const volume = Math.min(VOLUME_MAX, Math.max(0, settings.volume + delta));
      this.context.updateSettings({ ...settings, volume });
    } else {
      this.context.updateSettings({ ...settings, muted: !settings.muted });
    }
  }
}
