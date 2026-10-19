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

## 2026-10-16 — Brick 2: toolchain (branch `chore/toolchain`)
- Toolchain copied from retro-shmup `f698786`: TS 6.0 strict, Vite, Vitest, ESLint (dependency rule, determinism, HTML sinks), knip, Prettier, husky (gitleaks, lint-staged, commitlint, `make verify`), CI light check + Gitleaks, CodeQL, Dependency Review, Scorecard. No Playwright yet (smoke with brick 5).
- SonarQube project `retro-blocks` auto-provisioned with the global analysis token; gate PASSED.
- review-local: 0 Must, 6 Should, 7 Nice. Applied: ADR-0004 (inherited toolchain decisions) replacing retro-shmup ADR references, CSP meta, README/SECURITY/CLAUDE.md refreshed, Playwright leftovers removed. Deferred: Scorecard `publish_results` when the repo goes private; adapter→domain/ports import rule at brick 5.

## 2026-10-16 — PR #1 merged (bricks 0–2)
- Squash `6e9d8de` on `main`: GDD, ADR-0001..0004, reviewed UML, toolchain and CI (`chore(repo)`).

## 2026-10-16 — Brick 3: Domain I (branch `feat/game`)
- Board (10 × 40), ActivePiece + `spawnPiece`, Srs (shapes + Guideline kick tables, y upward), `Prng` port + `SeededPrng` (xoshiro128** copied from retro-shmup `f698786`, output verified identical on 6 seeds × 1000 draws), Bag7 (in-place Fisher–Yates, lazy refill across bags). Written test-first.
- MCDA: `Prng.nextInt(max)` as in the UML (465/500); `Board.lock` returns full rows and a new `clearRows` removes them after the clear delay (440/500 vs 330 for clearing inside `lock`). UML updated accordingly.
- Gotchas: `!` is lint-banned and `noUncheckedIndexedAccess` is on, so shapes are 4-tuples destructured in the board (no dead guards, no loops); parameter properties are rejected by `erasableSyntaxOnly`.
- review-local: 3 Must + 7 Should fixed (per-frame allocation removed with reused buffers, `lock` precondition, golden kick/PRNG tables). Gate green: 78 tests, 90.7 % branches, docs 100 %, Sonar PASSED.

## 2026-10-19 — Brick 4: Domain II (branch `feat/game`)
- AutoShift (DAS 10 / ARR 2), LockDelay (30 frames, 15 resets, lowest-row rule), Gravity (Guideline curve as integer sub-cells, levels 1–15), Scoring (GDD §4), IntentFrame, and Simulation (hold → rotate → shift → drop → gravity → lock, 20-step Clearing, T-spin via `lastRotationKick`, block/lock out). Test-first; reused `StepOutcome` / `SimView`, no allocation in the step path.
- MCDA (owner-validated): gravity table = precomputed Guideline curve (455/500 vs NES frames 380, runtime `Math.pow` 340); `SimView` = reused object with a read-only `BoardView` (445/500 vs copied cells 415, getters 335); after review: 15 resets then the countdown runs out (440/500 vs lock on 16th move 385, status quo 365), input ignored during Clearing (410/500, revisit at the brick 5 tuning), combo literal from the GDD (430/500).
- review-local: 4 Must (test gaps) fixed, 6 Should fixed (UML drift, read-only score, doc contracts). Sonar S3358 / S7735 fixed. Gate: 176 tests, 94.2 % branches, docs 100 %, Sonar PASSED.
- Open Nice: `detectSpin` as a pure function, `lowestY` tracks the box row, `startLevel` validation, configurable DAS/ARR, `Bag7.fill` spread allocation.
