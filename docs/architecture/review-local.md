# Local review — retro-blocks (branch `ci/36-local-ci-no-workflows`, `--push`)

- Date: 2026-11-10
- Commit: a5a8b07 (checked), Nice fixes and this report on the following commit
- Scope: branch diff `main...HEAD` (issue #36: every check moved to local CI, GitHub workflows removed)
- Checks run: adversarial (Opus, 2 rounds) · design · docs · tests · security · correctness
- Verdict: ship — Must 4 (fixed) · Should 8 (fixed) · Nice 7 (3 fixed, 1 filed, 3 after the merge)
- Previous report (2026-10-22, brick 6): git history, commit 9125c52

## Adversarial review (#236)

- Round 1 on `418be12`: Must 4 · Should 4 · Nice 7 · unverified 0 · Push gate: closed — 4 Must open
- Round 2 on `a5a8b07`: 8 fixed · 0 not fixed · 0 regressed · new Must 0 · **Push gate: open**
- Optional second review (owner's OpenAI account): ChatGPT/Codex not run (never a gate step)

## Pre-merge gate (head SHA a5a8b07, `--push` mode)

| Step | Result |
|---|---|
| 0 CI mirror | n/a after this change: no PR workflow left; before it, every job of `ci.yml` has a `just check` command (lint, typecheck, knip, Prettier, Vitest with coverage; `vite build` in `just gate` through `pnpm test:smoke`); CodeQL → Semgrep CE, dependency-review → `pnpm audit --audit-level high`, gitleaks-action → gitleaks CLI, Scorecard dropped (GitHub-only) |
| 1 Tests | ✅ 268 Vitest · ✅ 110 `test-local-ci.sh` · ✅ 31 `test-attest.sh` · smoke: ⏸ deferred to `just gate` |
| 2 Coverage | tests 98.66 % stmts / 90.74 % branches / 98.11 % funcs / 99.64 % lines (floor 80, runner floor 90) · docs 95.7 % (floor 90) |
| 3 SonarQube | ⏸ deferred to the pre-merge run (`just gate`, project key `retro-blocks` exists on http://localhost:9000) |
| 4 Secrets | ✅ gitleaks clean (full history) · ✅ TruffleHog 0 secrets (offline, full history) · no tracked .env · diff read: nothing sensitive (`allowed_signers` holds a public key only) |
| 5 E2E/smoke | ⏸ deferred to the pre-merge run (`just smoke` inside `just gate`, 3 engines) |

- Gate: **pre-push green** — `mise x -- just check` passed on a5a8b07; SonarQube and smoke deferred to `just gate` on the pushed head (never GREEN in `--push` mode)
- Timings on this machine: L0 `just fast` 3 s (6 staged files) · L1 `just check` 45 s (budget 3 min)

## 🔴 Must Have

_None open._ Fixed in a5a8b07:

- `PROJECT_LOG.md` `[adversarial|docs]` · claimed branch protection already applied · now "applied at the bootstrap merge, recorded once verified"
- `.github/branch-protection.md` `[adversarial|docs|security]` · stale private-repo wording, plain `just gate`, Copilot/Codex bot as required approval · rewritten: public repo, `GATE_CI_CHANGE=1 just gate` at bootstrap, 0 required reviews (owner rule 2026-11-07)
- `.github/pull_request_template.md` `[adversarial|docs]` · `style` type, missing `deps` scope · aligned on `scripts/check-commit-msg.sh` and `CLAUDE.md`
- `justfile` gate guard `[adversarial|security|correctness]` · narrow pathspec, rename-blind, wording claimed a sandbox · pathspec widened (mise, pnpm, `.nvmrc`, Semgrep config), `--no-renames`, reworded "review tripwire, not a sandbox" (ADR-0005), `GATE_CI_CHANGE=true` refused
- `justfile` gate `[tests|correctness]` · checks ran on whatever `node_modules` was present · `pnpm install --frozen-lockfile` is the first gate step (`PNPM_FAIL` case tested)
- `scripts/test-local-ci.sh` merge cases `[tests]` · PR head equal to HEAD gave false confidence on `--match-head-commit` · fixture uses `PR_HEAD=origin/ahead`
- `docs/decisions/ADR-0005` `[docs]` · `check-cassettes.sh` copied without a `record` recipe, unexplained · rationale recorded (verbatim copy of `~/.claude/scripts`, tested by `test-attest.sh`; upstream agents-skills#400)

## 🟡 Should Have

_None open._ Fixed in a5a8b07: `SECURITY.md` attestation claim · nightly timer installed and documented (`scripts/systemd/README.md`) · squash strategy recorded (ADR-0005 decision 2) · `lefthook install --reset-hooks-path` · README deduplicated · test-plan cadence · ADR-0004 row marked superseded · step-reached and wiring assertions, env unsets in `test-local-ci.sh` · `.trufflehog-exclude` removed (0 secrets without it).

## 🔵 Nice to Have

- `tests/smoke/first-playable.spec.ts:4` `[docs]` · ADR-0003 cited for the smoke test · fixed: "brick 5, PROJECT_LOG 2026-10-19"
- `scripts/systemd/README.md` `[correctness]` · linked units vanish when a branch without them is checked out · fixed: one paragraph says so and offers the copy alternative
- `docs/decisions/ADR-0005` L2 row and `scripts/test-local-ci.sh` header `[docs]` · `pnpm install` step and guard loop not listed · fixed
- `.github/CODEOWNERS` `[docs]` · "an AI reviewer once one is configured" contradicted the 2026-11-07 rule · fixed
- Dependabot github-actions PRs #15, #31, #32, #34, #35 `[correctness]` · obsolete once no workflow exists · close after the merge
- `.husky/_` leftover in the checkout `[correctness]` · ignored folder · delete by hand after the merge (ADR-0005 § Consequences)
- L0/L1 timings in the PR body · above, copied into the PR

## ⚪ Disagree / Intentional

- `scripts/attest.sh`, `scripts/test-attest.sh`, `scripts/check-cassettes.sh` `[tests|security]` · verbatim copies of `~/.claude/scripts`, not of retro-shmup's hardened copies (option-shaped guard, status context check, foreign-key tag test) · the global copy holds #376 and #380; both drifts are upstream work, filed as agents-skills#400 (tests) and agents-skills#401 (guard model); the no-drift rule of lot 2 wins here
- `GATE_CI_CHANGE` guard read from the branch's own `justfile` `[security]` · a branch deleting the guard is never refused · documented as a tripwire in ADR-0005; the guard-from-`origin/main` pattern is agents-skills#401
- `.trufflehog-exclude` dropped `[security]` · differs from retro-shmup; the file only excluded itself and TruffleHog reports 0 secrets without it

## Per-dimension summary

- Adversarial: 4 Must + 4 Should in round 1, all fixed and verified in round 2, gate open · Design: one toolchain, tiers compose, no speculative recipe; guard model questioned (upstream) · Docs: ADR-0005 complete, stale claims removed, remaining citations aligned · Tests: 110 wiring cases cover order, guard paths, failure propagation, `--match-head-commit` with a distinct PR head; `test-attest.sh` gaps upstream · Security: gitleaks and TruffleHog clean, no new trust input, public key only in `allowed_signers` · Correctness: `pnpm install` first, head captured before the checks, HEAD-moved refusal tested
