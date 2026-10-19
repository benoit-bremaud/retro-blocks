# Components

Dependency rule: `domain` imports nothing from the browser. Adapters implement the domain ports;
only `app/main.ts` (composition root) touches `window` / `document` and wires adapters in.
The frame loop is generic (copied from retro-shmup, ADR-0002): it drives a `FrameTarget` and knows
nothing about the game.

```mermaid
flowchart TB
  subgraph adapters
    Canvas[CanvasRenderer]
    Keyboard[KeyboardInput]
    Store[LocalStorageSave]
    Synth[AudioSynth]
    PClock[PerformanceClock]
  end
  subgraph app
    Main[main.ts composition root]
    Loop[FrameLoop 60 Hz accumulator]
    Layout[Viewport integer scale]
  end
  subgraph domain
    subgraph ports
      RenderPort
      InputPort
      AudioPort
      SavePort
      Clock
      Prng
      FrameTarget
    end
    Scenes[SceneMachine = FrameTarget]
    Presenter[RunPresenter]
    Sim[Simulation]
    Board
    Srs[Srs tables]
    Bag[Bag7]
    Score[Scoring]
  end
  Canvas -.implements.-> RenderPort
  Keyboard -.implements.-> InputPort
  Synth -.implements.-> AudioPort
  Store -.implements.-> SavePort
  PClock -.implements.-> Clock
  Main --> Loop
  Main --> Canvas
  Main --> Keyboard
  Main --> Synth
  Main --> Store
  Main --> PClock
  Main --> Scenes
  Main --> Layout
  Layout --> Canvas
  Loop --> Clock
  Loop --> InputPort
  Loop --> Scenes
  Scenes --> Sim
  Scenes --> Presenter
  Scenes --> SavePort
  Presenter --> RenderPort
  Presenter --> AudioPort
  Sim --> Board
  Sim --> Bag
  Sim --> Score
  Board --> Srs
  Bag --> Prng
```

- `SceneMachine` creates a new `Simulation` per run and per retry.
- The seed is drawn in `main.ts` and recorded with the score, which enables replays (as retro-shmup ADR-0019).

## Brick 5 (engine and render) deltas

- `FrameTarget` (the loop's only view of the game) is a domain port, so `SceneMachine` implements it without importing `app/`.
- `SavePort` and its adapter stay in the diagram but are built in brick 6 (hall of fame): nothing persists in brick 5.
- `AudioPort` ships with a silent default (`SILENT_AUDIO`); `AudioSynth` is built in brick 6.
- Lint rule added: an adapter imports only `domain/ports/**` (never another domain module) and never `app/`. The `Intent` flags and `IntentFrame` therefore move to `domain/ports/input-port.ts`.
- `Viewport` (integer scale from the window size) lives in `app/` and feeds the renderer; `main.ts` calls it on `resize`.
