# Local review — retro-blocks (branch `feat/game` vs `main`, brick 3)

- Date: 2026-10-16
- Commit: head of `feat/game` (see PR)
- Scope: branch diff `main...HEAD` (src/domain, tests/domain, UML, PROJECT_LOG)
- Checks run: design · docs · tests · correctness (security: pure domain, no I/O, read inline)
- Verdict: ship — all Must fixed · Must 0 open · Should 0 open (2 deferred) · Nice 4 open

## Pre-merge gate (head SHA of the PR)
| Step | Result |
|---|---|
| 1 Tests | ✅ 78 unit tests · no E2E yet (smoke arrives with brick 5) |
| 2 Coverage | tests 97.7 % stmts / 90.7 % branches / 100 % funcs (floor 80, runner 90) · docs 100 % (floor 90) |
| 3 SonarQube | ✅ PASSED (one S2933 found on the first scan, fixed) |
| 4 Secrets | ✅ gitleaks clean on `main..HEAD` · no tracked .env · diff read: nothing sensitive |
| 5 QA pass | ✅ smoke only (domain-only diff, no UI wired): `pnpm build` OK, no runtime change in `src/app` |
- Gate: **GREEN — merge authorised**

## 🔴 Must Have (all fixed)
- `board.ts` `[design][correctness]` · `dropDistance` allocated an object per loop step (per-frame ghost) · fixed with `fitsAt(piece, y)`.
- `srs.test.ts` `[tests]` · kick "negation" test checked only 2 of 16 transitions · replaced by golden tables for all 16.
- `srs.test.ts` `[tests]` · shapes asserted only for T/I · spawn literals for all kinds + clockwise-turn property.

## 🟡 Should Have (fixed unless noted)
- `board.ts` `[design][docs]` · `lock` had no precondition · now throws `RangeError`, documented.
- `board.ts`, `bag7.ts` `[design]` · per-call arrays in `lock`, `preview`, `fill` · reused buffers, in-place Fisher–Yates.
- `seeded-prng.test.ts` `[tests]` · relative-only determinism · golden vector from retro-shmup.
- `bag7.test.ts` `[tests]` · stub ignored `max` · asserts the shrinking ranges and a second stub.
- `board.test.ts` `[tests]` · `clearRows` edge cases, `dropDistance` overhang · added.
- `[docs]` · spawn rows wording, `PIECE_KINDS` coupling, `Prng` contract, UML staleness · fixed.
- Deferred: `Prng.nextInt` argument validation (callers are internal; revisit if exposed).

## 🔵 Nice to Have (open)
- `piece-kind.ts` `[design]` · export a shared `cellCode(kind)` when the render brick decodes cells.
- `srs.ts:18` `[docs]` · one-line WHY for the 3 × 3 O box.
- `board.ts` `[docs]` · WHY comment for the unrolled four-cell access (now present as a short note).
- `board-size.test.ts` removed as redundant (done).

## ⚪ Disagree / Intentional
- `Prng` port with a single implementation: tests inject randomness; precedent ADR-0002 / retro-shmup.
- ASCII `DRAWINGS` parsed at load: reviewable, outside the loop.

## Per-dimension summary
- Design: no SOLID issue, allocation on frame paths removed · Docs: ~100 % presence, gaps were contracts · Tests: 78 tests, no domain mocking, golden tables now · Security: nothing (pure domain) · Correctness: tables and algorithms verified against the Guideline and xoshiro reference.
