import { Intent } from './intent';

/** Frames a direction is held before it starts repeating (GDD §7). */
const DAS = 10;
/** Frames between repeats once the delay has elapsed (GDD §7). */
const ARR = 2;

/** Horizontal auto-repeat: one cell on the press, then DAS 10 / ARR 2 at 60 Hz (UML 02-class). */
export class AutoShift {
  private direction = 0;
  private frames = 0;

  /** Returns −1 (left), 0 or +1 (right): how many cells to shift this step. */
  step(held: number, pressed: number): number {
    const left = (held & Intent.Left) !== 0;
    const right = (held & Intent.Right) !== 0;
    const pressedLeft = (pressed & Intent.Left) !== 0;
    const pressedRight = (pressed & Intent.Right) !== 0;

    // Left and right pressed together cancel out and fall through, keeping the current direction.
    if (pressedLeft !== pressedRight) {
      this.direction = pressedLeft ? -1 : 1;
      this.frames = 0;
      return this.direction;
    }
    if (!this.isHeld(left, right)) {
      // Resume the other held direction with a fresh charge, no initial move.
      this.direction = Number(right) - Number(left);
      this.frames = 0;
      return 0;
    }
    this.frames += 1;
    const repeating = this.frames >= DAS && (this.frames - DAS) % ARR === 0;
    return repeating ? this.direction : 0;
  }

  private isHeld(left: boolean, right: boolean): boolean {
    return (this.direction === -1 && left) || (this.direction === 1 && right);
  }
}
