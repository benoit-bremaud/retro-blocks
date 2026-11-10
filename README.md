# retro-blocks

Browser falling-block puzzle game (codename). TypeScript strict + native Canvas 2D + Vite.

**Status:** brick 6 — menu, settings (English / French, volume, mute), hall of fame (top 10, saved in the browser), synthesised sound effects, on top of the playable game (brick plan in ADR-0003).

## Develop

Node 22, pnpm 10. Install [mise](https://mise.jdx.dev) (`curl https://mise.run | sh`), then
`just setup` (pinned toolchain, dependencies, git hooks), then `pnpm dev`.

**Quality gate, local only**, no GitHub workflow: four `just` tiers (`just --list`; contents and
rationale in ADR-0005). `just gate` needs `sonar-scanner`, a SonarQube server at
`http://localhost:9000` (token in `$SONAR_TOKEN` or `~/.config/sonarqube/analysis-token`) and the
Playwright browsers (`pnpm exec playwright install chromium firefox webkit`).

> The genre's best-known title is a registered trademark. This repo uses a codename, original
> assets and no trademarked name or artwork.

- Design: [docs/design/game-design-document.md](docs/design/game-design-document.md)
- Decisions: [docs/decisions/](docs/decisions/)
- UML: [docs/architecture/diagrams/](docs/architecture/diagrams/)
