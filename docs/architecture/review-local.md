# Local review — retro-blocks (branch chore/toolchain)

- Date: 2026-10-16
- Commit: 0b15f1f
- Scope: whole root commit (no `main` yet) — toolchain brick
- Checks run: design · docs · tests · security · correctness
- Verdict: ship · Must 0 · Should 6 · Nice 7 — all 6 Should and 5 Nice applied in the follow-up commit (ADR-0004 added); 2 Nice deferred (Scorecard at go-private, adapter import rule at brick 5)

## Pre-merge gate (head SHA 0b15f1f)
| Step | Result |
|---|---|
| 1 Tests | ✅ 1 unit test · no smoke suite yet (brick 5) |
| 2 Coverage | tests 100 % stmts / 100 % branches / 100 % funcs / 100 % lines (floor 80) · docs 100 % (3/3, floor 90) |
| 3 SonarQube | ✅ PASSED (project `retro-blocks`, auto-provisioned) |
| 4 Secrets | ✅ gitleaks clean (full history) · no tracked .env · diff read: nothing sensitive |
| 5 QA pass | ✅ build only (`vite build`, 0.84 kB) — no UI yet, placeholder `main.ts` |
- Gate: **GREEN for push**; merge after the Should fixes.

## 🔴 Must Have
_None._

## 🟡 Should Have
- `tsconfig.domain.json:2`, `tsconfig.node.json:2` `[design|correctness]` · cite ADR-0003/0011, which here mean another thing or do not exist · point to `01-component.md` and `retro-shmup ADR-0011`.
- `ci.yml:1`, `scorecard.yml:2`, `dependabot.yml:27,30`, `eslint.config.mjs:7,28,32,145,150` `[docs|design]` · retro-shmup ADRs cited in a public repo · add a local ADR-0004 "inherited toolchain decisions" linking them, cite it.
- `eslint.config.mjs:94`, `sonar-project.properties:16` `[design]` · "no allocation in the loop" rule cited from a CLAUDE.md that lacks it · add the rule to `CLAUDE.md`.
- `README.md:5` `[docs]` · status still "brick 0, no code" · "brick 2 — toolchain (ADR-0003)".
- `SECURITY.md:33` `[security|docs]` · describes storage that does not exist yet · state current reality, storage planned.
- `index.html` `[security]` · no CSP although `vite.config.ts:6` relies on one · add a strict CSP meta.

## 🔵 Nice to Have
- `eslint.config.mjs:65`, `.gitignore:39`, `.prettierignore:12`, `vitest.config.ts:10`, `sonar-project.properties:13` `[design]` · Playwright leftovers · remove until the smoke test exists.
- `tsconfig.domain.json:5` `[design]` · unused `tsBuildInfoFile` · remove.
- `sonar-project.properties:5` `[design]` · Sonar URL duplicated with the Makefile · keep the Makefile one.
- `commitlint.config.mjs:1,24` `[docs]` · cites a missing CONTRIBUTING.md, shmup scope `levels` · fix comment, drop scope.
- `Makefile` / README `[docs]` · pre-push needs local SonarQube, gitleaks, sonar-scanner · document prerequisites.
- `scorecard.yml` `[security]` · `publish_results: true` needs a public repo · disable at the first production deploy (repo goes private).
- `eslint.config.mjs:150` `[design]` · adapters may import any domain module · restrict to `domain/ports` when the first adapter lands (brick 5).

## ⚪ Disagree / Intentional
- ESLint + browser-free `tsconfig.domain.json` · complementary, not redundant (tsconfig catches `self`, `location`, DOM types).
- `prettier --check` in lint-staged · intentional, same as retro-shmup.
- Coverage thresholds at 90 · ratchet, raised when the domain lands.

## Per-dimension summary
- Design: dependency rule enforced (probed); retro-shmup leftovers only. · Docs: stale README / SECURITY / ADR refs. · Tests: one trivial test, adequate for a toolchain brick. · Security: actions SHA-pinned, least privilege, no token echo; CSP missing. · Correctness: CI steps match scripts; Node 22 OK.
