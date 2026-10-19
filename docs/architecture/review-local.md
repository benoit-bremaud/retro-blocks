# Local review — retro-blocks (brick 4, branch diff main...HEAD)

- Date: 2026-10-19
- Commit: see `git log` on `feat/game` (reviewed at fee3259, fixes applied after)
- Scope: branch diff `main...HEAD` (Domain II: AutoShift, LockDelay, Gravity, Scoring, Simulation)
- Checks run: design · docs · tests · security · correctness
- Verdict: fix Must first (done) · Must 4 (all fixed) · Should 9 (6 fixed, 3 awaiting owner) · Nice 9

## Pre-merge gate (push gate, no UI so no QA pass)
| Step | Result |
|---|---|
| 1 Tests | ✅ 176 unit tests, no E2E yet (brick 5) |
| 2 Coverage | tests 98.9 % stmts / 94.2 % branches / 100 % funcs · docs 100 % (30/30, floor 90) |
| 3 SonarQube | ✅ PASSED (after fixing S3358 and S7735) |
| 4 Secrets | ✅ gitleaks clean · diff is pure domain code and docs |
| 5 QA pass | ⚠️ n/a: no runnable product until brick 5 |

## 🔴 Must Have (all fixed)
- `tests/domain/simulation.test.ts` `[tests]` · spin reset after fall / hard drop untested → added.
- `tests/domain/simulation.test.ts` `[tests]` · T pointing up (rotation 0) front corners untested → Full and Mini added.
- `tests/domain/scoring.test.ts` `[tests]` · back-to-back with Mini, zero-line Mini, level > 1 → added.
- `simulation.test.ts` `[tests]` · spin + line clear end to end: not added, covered by the 400-point spin lock test plus the single and quad clear tests; Scoring unit tests cover the combination.

## 🟡 Should Have
- Fixed: UML drift (`lockDelay`, `spawn`, `lastRotationKick`, DAS/ARR constants, combo wording, drop methods) · `Scoring` fields read-only + `addSoftDrop`/`addHardDrop` · doc contract of `award`, `ghostY`, step order, `Pause` · weak LockDelay/AutoShift/Gravity tests.
- Awaiting owner: 15th reset locks immediately (`lock-delay.ts:26`) · input dropped during Clearing (`simulation.ts:133`) · combo reading (`scoring.ts`).

## 🔵 Nice to Have
- `detectSpin` as a pure function · `lowestY` tracks the box row, not the lowest cell · `startLevel` validation at the settings boundary · expose `pendingRows` in `SimView` · DAS/ARR configurable (GDD §7) · `Bag7.fill` spread push allocates (brick 3 file) · `SimView.next` draws from the Prng lazily (single owner only) · magic numbers `CLEAR_FRAMES` etc. without GDD refs.

## ⚪ Disagree / Intentional
- `ObstacleBoard` test subclass of the real `Board` (seam, not a mock) · `spin-kind.ts` separate file (avoids a scoring→simulation import) · `Simulation` constructor `board` parameter.
