# Scene state machine (SceneMachine)

```mermaid
stateDiagram-v2
  [*] --> Menu
  Menu --> Settings: settings
  Settings --> Menu: back
  Menu --> HallOfFame: scores
  HallOfFame --> Menu: back
  Menu --> Run: start (new Simulation)
  Run --> Run: pause toggle (step() not called while paused)
  Run --> GameOver: StepOutcome.toppedOut
  GameOver --> NameEntry: score qualifies
  GameOver --> Run: retry (new Simulation)
  GameOver --> Menu: menu
  NameEntry --> HallOfFame: saved
  NameEntry --> Menu: skip
```

Brick 5 builds only `Run`, `Paused` (the pause toggle drawn as a self-loop above becomes an explicit state) and `GameOver` with its retry; the menus, name entry and hall of fame arrive in brick 6.

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
