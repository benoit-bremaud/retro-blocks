# Local review — retro-blocks (brick 5, branch diff main...HEAD)

- Date: 2026-10-19
- Commit: see `git log` on `feat/engine` (reviewed at 8a7afba, fixes applied after)
- Scope: branch diff `main...HEAD` (engine and render: FrameLoop, SceneMachine, RunPresenter, adapters, smoke test)
- Checks run: design · docs · tests · security · correctness
- Verdict: ship after the selected Should fixes (done) · Must 0 · Should 13 (selected ones fixed, rest to file) · Nice 14

## Pre-merge gate (reviewed SHA 8a7afba, re-run after fixes)
| Step | Result |
|---|---|
| 1 Tests | ✅ 232 unit tests · ✅ browser smoke in Chromium, Firefox and WebKit (`make smoke`) |
| 2 Coverage | tests 98.4 % stmts / 91.1 % branches (floor 80) · docs 93.7 % (59/63, floor 90) |
| 3 SonarQube | ✅ PASSED (5 minor findings fixed: S7758, S7764 ×3, S7735) |
| 4 Secrets | ✅ gitleaks clean · no tracked .env · diff read: nothing sensitive |
| 5 QA pass | ✅ full · console clean · screenshots: `docs/architecture/qa/2026-10-19-brick5/` (line-clear flash not captured: random seed, covered by unit tests) |

## 🔴 Must Have
_None._

## 🟡 Should Have
- Fixed: UML drift in `03-class-engine.md` · `FONT` reused by `CanvasRenderer` · `cellCode` shared · `BOARD_WIDTH` / `DRAWN_ROWS` instead of 10 / 22 · `BIT_COUNT` derived from `Intent` · key pressed with Cmd no longer sticks (`keyboard-input.ts`) · `overflow: hidden` removed so a small window scrolls · stale `current` comment and ADR references · frame-loop assertions made exact · SceneMachine transitions, preview and overlay positions, `clear4` / Mini cases, glyph tables tested · smoke test split in steps and frame-based instead of sleeps.
- To file as issues (owner OK pending): `pnpm dev` under the CSP may lose its style (to verify first).

## 🔵 Nice to Have
- Frame loop frozen for good after an exception in `step` / `render` · no auto-pause on blur or `visibilitychange` · a key held across a focus change is ignored · fractional DPR and monitor change · `setScale` / `computeViewport` signatures · panel y-offsets as named constants · `Escape` literal in `keyboard-input.ts` · palette comments · `?? Palette.flash` fallback comment.

## ⚪ Disagree / Intentional
- `Clock`, `FrameTarget` ports with one implementation: test seams and the dependency direction. `AudioPort` without adapter: validated in the UML, built in brick 6.
- Smoke test reads canvas pixels, no test hook (ADR-0003).

## Per-dimension summary
- Design: hard rules pass, no over-engineering · Docs: 93.7 %, stale comments fixed · Tests: healthy pyramid, assertions tightened · Security: no sink, CSP fine in production · Correctness: no bug found beyond the Cmd key and the CSS clip.
