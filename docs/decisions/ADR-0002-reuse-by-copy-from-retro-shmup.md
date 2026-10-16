# ADR-0002: Reuse generic modules by copy, no shared package yet

**Status:** Accepted — 2026-10-16

## Decision
Copy and adapt generic retro-shmup modules (frame loop, clock, random, ports, canvas renderer,
viewport, input, save, hall of fame, i18n, audio synth). Source SHA: `f698786` (retro-shmup HEAD at 2026-10-16).
No shared package until a third game consumes them (rule of three; retro-maze is the third, decide then).

## Consequences
Some duplication is accepted over a premature abstraction; re-sync is manual and traceable via this SHA.
