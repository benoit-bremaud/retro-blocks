# ADR-0004: Toolchain and quality gate inherited from retro-shmup

**Status:** Accepted — 2026-10-16

## Context
ADR-0002 copies retro-shmup's generic code. Its toolchain decisions are just as reusable, but
this repository is public and must not depend on another repository's ADRs to be understood.

## Decision
Adopt these retro-shmup decisions (source SHA `f698786`), restated here:

| Topic | Decision | retro-shmup origin |
|---|---|---|
| Dependency rule | `src/domain` imports no browser API and no package; adapters implement ports; only `src/app/main.ts` touches `window` / `document`. Enforced by ESLint and by `tsconfig.domain.json`, which compiles the domain without DOM types. | ADR-0003, ADR-0014, ADR-0015 |
| Determinism | No `Date` / `Math.random` in the domain: fixed steps and an injected seeded PRNG. | ADR-0002, ADR-0009 |
| No allocation in the loop | Index loops in `src/`; `for...of` is banned (it allocates an iterator below V8's optimizing tier, measured 2026-10-08). | CLAUDE.md |
| Toolchain | TypeScript 6.0 strict (typescript-eslint supports < 6.1), Node 22, pnpm, Vite, Vitest, ESLint strict type-checked, Prettier, knip; tool configs typed with Node types only. | ADR-0011 |
| Local-first gate | `make verify` in the pre-push hook: typecheck, lint, knip, format, tests with coverage, doc coverage, gitleaks, `pnpm audit`, local SonarQube with quality-gate wait. CI keeps a light check plus the security workflows (Gitleaks, CodeQL, Dependency Review, OSSF Scorecard non-blocking). | ADR-0007, ADR-0013 |

## Consequences
Rules are stated here once and cited by the config files. A change to one of them needs a new ADR
in this repository, whatever retro-shmup does later.
