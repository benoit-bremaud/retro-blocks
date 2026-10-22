# Scene state machine (SceneMachine)

```mermaid
stateDiagram-v2
  [*] --> Menu
  Menu --> Run: start (new Simulation)
  Menu --> HallOfFame: scores
  Menu --> Settings: settings
  Settings --> Menu: back
  HallOfFame --> Menu: back
  Run --> Run: pause toggle (step() not called while paused)
  Run --> NameEntry: topped out, score qualifies
  Run --> GameOver: topped out, no entry
  GameOver --> Run: retry (new Simulation)
  GameOver --> Menu: menu
  NameEntry --> HallOfFame: saved or skipped
```

Brick 6 builds every state (see system/04-class-brick6). `Paused` and `GameOver` are states of `RunScene`; a qualifying run goes straight to `NameEntry` (the game over sound still plays).

The piece phases (`Falling`, `Clearing`) live inside `Simulation` and are counted in fixed steps,
so pause, replays and display refresh rate never change gameplay timing.

```mermaid
stateDiagram-v2
  [*] --> Falling
  Falling --> Clearing: lock completes rows
  Falling --> Falling: lock without clear (spawn next)
  Clearing --> Falling: clearFrames reaches 0 (spawn next)
  Falling --> [*]: block out or lock out
  Clearing --> [*]: spawn blocked
```
