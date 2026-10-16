# Domain classes

All classes live in `src/domain/` and import nothing from the browser. Randomness comes from an
injected seeded `Prng`; time is counted in fixed 60 Hz steps (no wall clock).

Board: 10 × 40 cells (Guideline buffer), `x` 0..9 left to right, `y` 0..39 **bottom to top**.
Rows 0–19 are visible. Pieces spawn occupying rows 20–21, so SRS rotations near the top never
leave the buffer.

```mermaid
classDiagram
  class PieceKind {
    <<enumeration>>
    I
    O
    T
    S
    Z
    J
    L
  }
  class SpinKind {
    <<enumeration>>
    None
    Mini
    Full
  }
  class Phase {
    <<enumeration>>
    Falling
    Clearing
  }
  class Simulation {
    -board: Board
    -active: ActivePiece
    -bag: Bag7
    -shift: AutoShift
    -lock: LockDelay
    -score: Scoring
    -held: PieceKind?
    -holdUsed: bool
    -phase: Phase
    -clearFrames: int
    -gravitySub: int
    -lastRotationKick: int?
    +constructor(rng: Prng, startLevel: int)
    +step(intent: IntentFrame) StepOutcome
    +view() SimView
    -tryHold()
    -detectSpin() SpinKind
    -spawn(kind: PieceKind) bool
  }
  class IntentFrame {
    +held: number
    +pressed: number
  }
  class StepOutcome {
    +clearedRows: int[]
    +spin: SpinKind
    +locked: bool
    +toppedOut: bool
  }
  class SimView {
    <<readonly>>
    +cells
    +active
    +ghostY
    +held
    +next[5]
    +points
    +level
    +lines
    +phase
    +clearFrames
  }
  class Board {
    -cells: Uint8Array
    +width = 10
    +height = 40
    +fits(piece: ActivePiece) bool
    +dropDistance(piece: ActivePiece) int
    +lock(piece: ActivePiece) int[]
    +clearRows(rows: int[])
    +isOccupied(x, y) bool
    +isLockOut(piece: ActivePiece) bool
  }
  class ActivePiece {
    +kind: PieceKind
    +rotation: 0..3
    +x: int
    +y: int
  }
  class Srs {
    <<data>>
    +shape(kind, rotation) Cell[]
    +kicks(kind, from, to) Offset[]
  }
  class Bag7 {
    -rng: Prng
    -queue: PieceKind[]
    +next() PieceKind
    +preview(n: int) PieceKind[]
  }
  class Prng {
    <<interface>>
    +nextInt(max: int) int
  }
  class AutoShift {
    +das = 10
    +arr = 2
    -frames: int
    +step(held: number, pressed: number) int
  }
  class LockDelay {
    +maxFrames = 30
    +maxResets = 15
    -frames: int
    -resets: int
    -lowestY: int
    +tick(grounded: bool) bool
    +onMoveOrRotate(grounded: bool)
    +onDescend(y: int)
    +reset(spawnY: int)
  }
  class Gravity {
    <<data>>
    +subCellsPerStep(level: int) int
  }
  class Scoring {
    +level: int
    +lines: int
    +points: int
    -combo: int
    -backToBack: bool
    +award(rows: int, spin: SpinKind)
    +addDrop(cells: int, hard: bool)
  }
  Simulation --> Board
  Simulation --> ActivePiece
  Simulation --> Bag7
  Simulation --> AutoShift
  Simulation --> LockDelay
  Simulation --> Scoring
  Simulation ..> Gravity
  Simulation ..> IntentFrame
  Simulation ..> StepOutcome
  Simulation ..> SimView
  Board ..> Srs
  Bag7 --> Prng
```

## Rules carried by the model

- **Input:** `IntentFrame` bit flags (Left, Right, SoftDrop, HardDrop, RotateCw, RotateCcw, Hold,
  Pause), `held` and `pressed` as in retro-shmup's input port. Rotate, hard drop and hold fire on
  `pressed` only. `AutoShift` returns −1, 0 or +1 cells for this step (DAS 10, ARR 2).
- **Step order:** hold → rotate → shift → hard / soft drop → gravity → lock. During `Clearing` the
  step only counts `clearFrames` down (20 steps), then spawns the next piece and checks top-out.
  Pause is handled by `SceneMachine`, which simply stops calling `step()`.
- **Board bounds:** `fits()` is false when x is outside 0..9 or y < 0. `isOccupied()` returns true
  outside the board (used by the T-spin corner rule).
- **Line clear:** `lock()` writes the piece and returns the completed rows (ascending) without removing
  them, so the renderer can flash them during `Clearing`; `clearRows()` removes them and drops the
  rows above once the 20 steps have elapsed.
- **Spawn:** `spawnPiece(kind)` puts the box at x = 3, y = 19: the piece fills rows 20–21, centred.
- **Top-out:** block out = the spawned piece does not fit; lock out = `isLockOut()` (every cell at
  y ≥ 20).
- **Gravity:** integer fixed point, 256 sub-cells per cell. Soft drop multiplies the level value by
  20 at the call site and scores 1 point per cell descended.
- **Lock delay:** `onMoveOrRotate` is called only after a *successful* move or rotation, and counts
  only when grounded. `onDescend(y)` resets frames and resets when y is a new lowest row.
  `tick` returns true when grounded and (frames ≥ 30 or resets ≥ 15).
- **Hold:** `tryHold()` does nothing when `holdUsed`; otherwise swaps with `held` (empty → take
  `bag.next()`), respawns and sets `holdUsed`, cleared when the next piece locks.
- **T-spin:** T only. `lastRotationKick` is 0 (no offset) … 4 (last SRS test), set by a successful
  rotation and cleared by any move or fall. Requires ≥ 3 of the 4 diagonal corners occupied;
  `Full` if both front corners are occupied or the kick was 4, otherwise `Mini`.
- **Bag:** `preview(n)` appends a new shuffled bag while the queue holds fewer than n pieces.
