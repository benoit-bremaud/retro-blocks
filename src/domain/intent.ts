/** Input bit flags, as in retro-shmup's input port (UML 02-class). `Pause` is handled by the scene machine: `Simulation` ignores it. */
export const Intent = {
  Left: 1,
  Right: 2,
  SoftDrop: 4,
  HardDrop: 8,
  RotateCw: 16,
  RotateCcw: 32,
  Hold: 64,
  Pause: 128,
} as const;

/** One step of player input: `held` is every flag down this step, `pressed` the flags that went down this step. */
export interface IntentFrame {
  readonly held: number;
  readonly pressed: number;
}
