# retro-blocks — Game Design Document (v0.1)

## 1. Pitch
Single-player falling-block puzzle. Stack seven tetrominoes, clear lines, survive rising speed.

## 2. Playfield
- 10 columns × 20 visible rows, inside a 10 × 40 buffer (Guideline). Coordinates: x 0..9 left→right, y 0..39 bottom→top.
- Logical play area 10 × 20 cells (plus 2 rows of spawn margin drawn faded); rendered at integer scale (nearest-neighbour), as in retro-shmup ADR-0014.

## 3. Rules (modern, no original bugs)
| Topic | Rule |
|---|---|
| Pieces | I, O, T, S, Z, J, L (original naming kept as neutral letters) |
| Randomizer | 7-bag, seeded PRNG (deterministic replays) |
| Rotation | SRS with wall kicks, 4 states per piece |
| Hold | One hold slot, one swap per piece drop |
| Next queue | 5 previews |
| Ghost piece | Shown at `Board.dropDistance`, toggleable |
| Gravity | Level-based table; soft drop ×20 of current gravity; hard drop instant lock |
| Lock delay | 30 frames (0.5 s at 60 Hz), reset on successful move/rotate, max 15 resets per piece |
| Spawn | Piece occupies rows 20–21, centred. Block out: spawn does not fit. Lock out: a piece locks with every cell at y ≥ 20 |
| Line clear | 1–4 rows simultaneously, rows above fall; 20-step clear delay counted by the simulation, then the next piece spawns |

## 4. Scoring
All values × level, using the level **before** any level-up caused by this clear.

| Action | Points |
|---|---|
| Single / Double / Triple / Four-line | 100 / 300 / 500 / 800 |
| T-spin Mini: no line / Single / Double | 100 / 200 / 400 |
| T-spin: no line / Single / Double / Triple | 400 / 800 / 1200 / 1600 |
| Combo | +50 × combo (combo starts at 0 on the 2nd consecutive clearing lock) |
| Soft drop / hard drop | 1 / 2 per cell (not × level) |

- Back-to-back ×1.5 on a four-line or a T-spin clear that follows another one. A Single, Double or
  Triple without a spin breaks the chain; a spin with no lines does not.
- A lock with no line clear resets the combo.

## 5. Levels
Start level 1; +1 level per 10 lines. Gravity table defined as data (cells/frame at 60 Hz), capped at level 15+.

## 6. Modes (scope)
- v1.0: Marathon only. Later bricks: Sprint (40 lines), Ultra (2 min).

## 7. Controls
Keyboard (arrows, Z/X rotate, C hold, Space hard drop, P pause); rotate, hard drop and hold fire once per key press; touch gestures later; DAS 10 frames / ARR 2 frames (60 Hz), configurable.
All durations are frame counts: the simulation is fixed-step and deterministic (no wall clock).

## 8. Persistence
Local storage only: hall of fame (top 10), settings. No backend (as retro-shmup ADR-0006).

## 9. Out of scope (v1)
Multiplayer, online ranking, garbage lines.

## 10. Open questions
- Exact gravity table values (to tune in the vertical slice).
- Touch control scheme.
