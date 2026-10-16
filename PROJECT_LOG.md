# PROJECT_LOG — retro-blocks

## 2026-10-16 — Brick 0 started
- Owner validated by MCDA: codename `retro-blocks` (470/500), stack TS strict + Canvas 2D + Vite (475/500), scope = brick 0 only (GDD + ADRs + UML, no code).
- Created folder, README, GDD, ADR-0001 (stack), ADR-0002 (reuse), UML gameplay + system diagrams.

## 2026-10-16 — Brick 1: start decision and UML completion
- Owner chose to start code now after UML review (MCDA 430/500 vs code directly 345, wait 335): ADR-0003 supersedes the brick-0-only scope.
- Class diagram completed (IntentFrame, StepOutcome, Srs, HoldSlot, LockDelay, Gravity, Prng); hold sequence added. Awaiting owner UML review.

## 2026-10-16 — Brick 1: UML review
- Self-review (5 Must, 5 Should, 2 Nice) then independent architecture-guardian review (5 Must, 6 Should, 4 Nice), all applied:
  clear delay counted in simulation steps (determinism), 10 × 40 board buffer with block/lock out, IntentFrame held/pressed + AutoShift (DAS/ARR), generic FrameLoop driving SceneMachine + RunPresenter, lock-delay reset rules, SimView read model, full scoring table, T-spin rule via lastRotationKick, HoldSlot folded into Simulation, explicit seed and constructor, stale CLAUDE.md rule fixed.
- Kept on purpose: Prng interface, four ports, LockDelay/Srs/Gravity as separate units.
