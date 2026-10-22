# Local review — retro-blocks (branch feat/ui, brick 6, `main...HEAD`)

- Date: 2026-10-22
- Commit: head of `feat/ui` after the review fixes
- Scope: branch diff `main...HEAD` plus review fixes
- Checks run: design · docs · tests · security · correctness
- Verdict: ship — Must 2 (fixed) · Should 8 (6 fixed, 2 filed as Nice) · Nice 6

## Pre-merge gate (head SHA of feat/ui)

| Step | Result |
|---|---|
| 1 Tests | ✅ 267 unit/integration · ✅ smoke Chromium + Firefox · ⚠️ WebKit not runnable here (system library `libmanette` missing after the OS upgrade; the same spec passed in all 3 engines on the previous commit of this brick) |
| 2 Coverage | tests 98.7 % stmts / 90.7 % branches / ~98.7 % funcs / ~99.6 % lines (floor 80) · docs 95.7 % (floor 90) |
| 3 SonarQube | ✅ PASSED (4 new smells fixed: S4043, 3 × S7735) |
| 4 Secrets | ✅ gitleaks clean (`main..HEAD`) · no tracked .env · diff read: nothing sensitive |
| 5 QA pass | ✅ full: menu, settings FR, empty hall, name entry, saved hall, hall after reload; console clean; screenshots `docs/architecture/qa/2026-10-19-brick6/` |

- Gate: **GREEN except WebKit (environment) — to re-run on CI**

## 🔴 Must Have (fixed)
- `settings-scene.ts`, `menu-scene.ts`, `name-entry-scene.ts` `[design]` · per-frame allocation in `render` (project rule) · labels cached per language, volume labels constant, points text built in `enter`.
- `settings-scene.ts` `[design]` · imported `moveCursor` from `menu-scene` (scenes never import each other) · moved to `scene.ts`.

## 🟡 Should Have
- `audio-synth.ts` `[design]` · `resume()` called per note · only when suspended. Fixed.
- `local-storage-save.ts` `[correctness]` · table cut to ten before sorting · sort then slice. Fixed.
- `04-class-brick6.md` `[docs]` · UML drift (enter signature, SceneContext, ToneOutput, RunResult, storage keys, Esc discards) · updated. Fixed.
- Tests `[tests]` · weak assertions (seed, wrap, clamp, failed write) · tightened; Esc-discard pinned by a test. Fixed.
- Doc blocks `[docs]` · `SceneMachine` constructor, `setVolume` clamping · added. Fixed.
- `scene.ts` `[design]` · `settings`/`scores`/`lastRun` public and writable · kept (single-writer scenes); revisit if a second writer appears.
- Footer constant `FOOTER_Y` `[design]` · added; the `330` literals are gone.

## 🔵 Nice to Have
- `audio-synth.ts` `[correctness]` · resume the audio context from the first `keydown` in `main.ts`, not from the loop.
- `first-playable.spec.ts` `[tests]` · assert each intermediate screen in the smoke test, not only the end state.
- `audio-synth.test.ts` `[tests]` · assert key facts of `WebAudioTones`, not the call order.
- `messages.test.ts` `[tests]` · compare sorted keys.
- Settings volume stops at its ends while Enter cycles other rows `[correctness]`.
- `text-layout.ts` `[design]` · `drawCentredAt` has one caller.

## ⚪ Disagree / Intentional
- `Settings`, `ScoreEntry`, `HALL_SIZE` live in `ports/save-port.ts` · adapters may import ports only (lint rule, ADR-0004).
- Esc on name entry discards the score · arcade skip, documented in UML 04 and pinned by a test.

## Per-dimension summary
- Design: two rule breaches fixed, UML aligned · Docs: ~96 % exported, drift fixed · Tests: trustworthy, weak assertions tightened · Security: no finding (untrusted storage validated, strict CSP) · Correctness: no blocking bug; transitions checked.
