import { Intent, type InputPort, type MutableIntentFrame } from '../domain/ports/input-port';

/** The fixed keyboard map, by physical key (`KeyboardEvent.code`); remapping arrives with the options screen. */
const KEY_MAP: Readonly<Record<string, number>> = {
  ArrowLeft: Intent.Left,
  ArrowRight: Intent.Right,
  ArrowDown: Intent.SoftDrop,
  Space: Intent.HardDrop,
  ArrowUp: Intent.RotateCw,
  KeyX: Intent.RotateCw,
  KeyZ: Intent.RotateCcw,
  KeyC: Intent.Hold,
  ShiftLeft: Intent.Hold,
  ShiftRight: Intent.Hold,
  KeyP: Intent.Pause,
  Escape: Intent.Pause,
  Enter: Intent.Confirm,
  NumpadEnter: Intent.Confirm,
};

const BIT_COUNT = 9;

/** Index of a single-bit flag, to count the keys down per intent. */
function bitIndex(flag: number): number {
  return 31 - Math.clz32(flag);
}

/**
 * Keyboard to `IntentFrame` (UML system/03-class-engine). The composition root forwards the
 * window's key events here; keys are counted per intent so two keys of one intent behave as one,
 * and a press is latched until the next `read`, so a tap shorter than a step is not lost.
 */
export class KeyboardInput implements InputPort {
  private readonly down = new Set<string>();
  private readonly counts = new Array<number>(BIT_COUNT).fill(0);
  private latched = 0;

  /**
   * Records a key going down. Returns true when the browser's default action must be prevented
   * (a mapped key, auto-repeats included, so a held arrow never scrolls the page); `Escape` keeps
   * its default so it can still leave fullscreen.
   */
  keyDown(code: string, repeat: boolean): boolean {
    const flag = KEY_MAP[code];
    if (flag === undefined) return false;
    if (!repeat && !this.down.has(code)) {
      this.down.add(code);
      this.counts[bitIndex(flag)] = (this.counts[bitIndex(flag)] ?? 0) + 1;
      this.latched |= flag;
    }
    return code !== 'Escape';
  }

  keyUp(code: string): void {
    const flag = KEY_MAP[code];
    if (flag === undefined || !this.down.delete(code)) return;
    this.counts[bitIndex(flag)] = Math.max((this.counts[bitIndex(flag)] ?? 0) - 1, 0);
  }

  /** Every key counts as released (lost focus), so none stays stuck down; latched presses are kept. */
  releaseAll(): void {
    this.down.clear();
    this.counts.fill(0);
  }

  read(into: MutableIntentFrame): void {
    let held = this.latched;
    for (let i = 0; i < BIT_COUNT; i += 1) if ((this.counts[i] ?? 0) > 0) held |= 1 << i;
    into.held = held;
    into.pressed = this.latched;
    this.latched = 0;
  }
}
