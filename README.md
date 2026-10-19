# retro-blocks

Browser falling-block puzzle game (codename). TypeScript strict + native Canvas 2D + Vite.

**Status:** brick 3 — domain I (board, SRS rotation, seeded PRNG, 7-bag); no playable build yet (brick plan in ADR-0003).

## Develop

Node 22, pnpm 10. `pnpm install`, then `pnpm dev`.

The pre-push hook runs `make verify`, which needs `gitleaks`, `sonar-scanner` and a SonarQube
server at `http://localhost:9000` (token in `$SONAR_TOKEN` or `~/.config/sonarqube/analysis-token`).

> The genre's best-known title is a registered trademark. This repo uses a codename, original
> assets and no trademarked name or artwork.

- Design: [docs/design/game-design-document.md](docs/design/game-design-document.md)
- Decisions: [docs/decisions/](docs/decisions/)
- UML: [docs/architecture/diagrams/](docs/architecture/diagrams/)
