# ADR-0001: TypeScript strict + Canvas 2D + Vite

**Status:** Accepted — 2026-10-16

## Context
A falling-block game needs a grid, a fixed-step loop and simple drawing: no physics, no sprite engine.
`retro-shmup` already provides loop, input, audio, save and i18n modules on this stack.

## Decision
TypeScript strict, native Canvas 2D behind a render port, Vite. Zero runtime dependency.
MCDA (owner-validated): this stack 475/500, Phaser 300, Godot 175.

## Consequences
Maximum reuse and consistency; the renderer stays swappable; the domain stays headless-testable.
