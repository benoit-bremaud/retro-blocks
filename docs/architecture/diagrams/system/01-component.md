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
  end
  subgraph domain
    subgraph ports
      RenderPort
      InputPort
      AudioPort
      SavePort
      Clock
      Prng
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
