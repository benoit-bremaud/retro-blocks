import type { IntentFrame } from './input-port';

/** What the frame loop drives: the scene machine in the game, a test double in tests. */
export interface FrameTarget {
  /** One fixed 60 Hz simulation step with the input of that step. */
  step(frame: IntentFrame): void;
  /** Draws the current state; called once per browser frame, after the steps. */
  render(): void;
}
