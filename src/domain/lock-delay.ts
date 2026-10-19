/** Grounded frames before the piece locks (GDD §3). */
const MAX_FRAMES = 30;
/** Grounded moves or rotations that may restart the countdown, per lowest row (GDD §3). */
const MAX_RESETS = 15;

/** Lock delay with the "lowest row" rule: reaching a new lowest row gives the resets back (UML 02-class). */
export class LockDelay {
  private frames = 0;
  private resets = 0;
  private lowestY = 0;

  /** Starts a new piece spawned at row `spawnY`. */
  reset(spawnY: number): void {
    this.frames = 0;
    this.resets = 0;
    this.lowestY = spawnY;
  }

  /** Counts one step; true when the piece must lock now. In the air the countdown stays at zero. */
  tick(grounded: boolean): boolean {
    if (!grounded) {
      this.frames = 0;
      return false;
    }
    this.frames += 1;
    return this.frames >= MAX_FRAMES || this.resets >= MAX_RESETS;
  }

  /** Call after a successful move or rotation: when grounded, restarts the countdown and spends a reset. */
  onMoveOrRotate(grounded: boolean): void {
    if (!grounded) return;
    this.frames = 0;
    this.resets += 1;
  }

  /** Call after the piece falls to row `y`: a new lowest row restores the frames and the resets. */
  onDescend(y: number): void {
    if (y >= this.lowestY) return;
    this.lowestY = y;
    this.frames = 0;
    this.resets = 0;
  }
}
