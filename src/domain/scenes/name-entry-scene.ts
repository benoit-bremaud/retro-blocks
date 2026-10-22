import { insertScore } from '../hall-of-fame';
import { Intent, type IntentFrame } from '../ports/input-port';
import type { RenderPort } from '../ports/render-port';
import { FOOTER_Y, SCREEN_WIDTH } from '../presentation/layout';
import { Palette } from '../presentation/palette';
import { drawCentred, textWidth } from '../presentation/text-layout';
import type { Scene, SceneContext, SceneId } from './scene';

const LETTERS = 26;
const NAME_LENGTH = 3;
const FIRST_LETTER = 65;
const NAME_SCALE = 5;

/** Arcade name entry: three letters, up and down change the letter, left and right the cell, Enter saves. */
export class NameEntryScene implements Scene {
  private readonly letters = [0, 0, 0];
  private cursor = 0;
  private name = 'AAA';
  private pointsText = '0';
  private readonly context: SceneContext;
  private readonly port: RenderPort;

  constructor(context: SceneContext, port: RenderPort) {
    this.context = context;
    this.port = port;
  }

  enter(): void {
    this.letters.fill(0);
    this.cursor = 0;
    this.name = 'AAA';
    this.pointsText = String(this.context.lastRun?.points ?? 0);
  }

  step(frame: IntentFrame): SceneId | null {
    if ((frame.pressed & Intent.Pause) !== 0) return 'HallOfFame';
    if ((frame.pressed & Intent.RotateCw) !== 0) this.shiftLetter(1);
    if ((frame.pressed & Intent.SoftDrop) !== 0) this.shiftLetter(-1);
    if ((frame.pressed & Intent.Left) !== 0) this.cursor = Math.max(0, this.cursor - 1);
    if ((frame.pressed & Intent.Right) !== 0)
      this.cursor = Math.min(NAME_LENGTH - 1, this.cursor + 1);
    if ((frame.pressed & Intent.Confirm) === 0) return null;
    if (this.cursor < NAME_LENGTH - 1) {
      this.cursor += 1;
      return null;
    }
    this.save();
    return 'HallOfFame';
  }

  render(): void {
    const { text } = this.context;
    this.port.clear(Palette.background);
    drawCentred(this.port, text.newRecord, 50, 2, Palette.text);
    drawCentred(this.port, this.pointsText, 80, 2, Palette.textDim);
    drawCentred(this.port, text.enterName, 120, 1, Palette.textDim);
    drawCentred(this.port, this.name, 160, NAME_SCALE, Palette.text);
    const advance = textWidth('A', NAME_SCALE) + NAME_SCALE;
    const left = SCREEN_WIDTH / 2 - textWidth(this.name, NAME_SCALE) / 2;
    this.port.fillRect(
      left + this.cursor * advance,
      160 + 5 * NAME_SCALE + 6,
      textWidth('A', NAME_SCALE),
      3,
      Palette.flash,
    );
    drawCentred(this.port, text.navigate, FOOTER_Y, 1, Palette.textDim);
  }

  private shiftLetter(delta: number): void {
    this.letters[this.cursor] = ((this.letters[this.cursor] ?? 0) + delta + LETTERS) % LETTERS;
    this.name = String.fromCodePoint(
      FIRST_LETTER + (this.letters[0] ?? 0),
      FIRST_LETTER + (this.letters[1] ?? 0),
      FIRST_LETTER + (this.letters[2] ?? 0),
    );
  }

  private save(): void {
    const run = this.context.lastRun;
    if (run === null) return;
    this.context.updateScores(insertScore(this.context.scores, { name: this.name, ...run }));
    this.context.lastRun = null;
  }
}
