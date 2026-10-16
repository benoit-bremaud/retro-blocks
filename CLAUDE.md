# retro-blocks — project rules

- Falling-block puzzle, browser. TypeScript strict, native Canvas 2D, Vite. Same conventions as `../retro-shmup`.
- Bricks per ADR-0003: design before code, one PR per brick; no implementation before the UML is validated.
- Never use the trademarked genre name in code, assets, UI or docs (codename `retro-blocks`).
- Domain never imports the browser. No `any`, no default exports. Tests mock boundaries, not the domain.
