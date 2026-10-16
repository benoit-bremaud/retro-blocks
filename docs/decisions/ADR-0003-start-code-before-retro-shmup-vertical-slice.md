# ADR-0003: Start retro-blocks code before the retro-shmup vertical slice

**Status:** Accepted — 2026-10-16. Supersedes the "brick 0 only" scope decision of 2026-10-16.

## Context
The scope decision kept retro-blocks at design only until the retro-shmup vertical slice was done,
to avoid several half-finished games. The owner wants to start now. The game is small (about
600 lines of domain code) and mostly reuses retro-shmup modules (ADR-0002).

## Decision
Start now, design before code, one PR per brick:
1. UML review and this ADR. 2. Toolchain. 3. Domain I (Board, Piece, SRS, Bag7). 4. Domain II
(gravity, lock delay, hold, clears, scoring). 5. Engine and render, first playable build.
6. Menus, hall of fame, i18n, audio.
MCDA (owner-validated): start after UML review 430/500, code directly 345, wait 335.

## Consequences
Two active projects. Each brick is finished (merged, logged) before the next one starts, so
neither project is left half-done mid-brick.
