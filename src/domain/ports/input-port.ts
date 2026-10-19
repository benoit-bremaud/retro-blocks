/**
 * Input bit flags, as in retro-shmup's input port (UML system/03-class-engine). `Pause` and
 * `Confirm` belong to the scene machine: `Simulation` ignores them.
 */
export const Intent = {
  Left: 1,
  Right: 2,
  SoftDrop: 4,
  HardDrop: 8,
  RotateCw: 16,
  RotateCcw: 32,
  Hold: 64,
  Pause: 128,
  Confirm: 256,
} as const;

/** One step of player input: `held` is every flag down this step, `pressed` the flags that went down this step. */
export interface IntentFrame {
  readonly held: number;
  readonly pressed: number;
}

/** The frame the input port fills in place, once per simulation step (no allocation in the loop). */
export type MutableIntentFrame = { -readonly [K in keyof IntentFrame]: IntentFrame[K] };

/** Player input, whatever the device. */
export interface InputPort {
  /** Fills the caller's frame in place; `pressed` holds the flags that went down since the previous read. */
  read(into: MutableIntentFrame): void;
}
