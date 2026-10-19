# Frame tick (browser frame to pixels)

```mermaid
sequenceDiagram
  participant Browser as requestAnimationFrame
  participant Loop as FrameLoop
  participant Clock
  participant Input as InputPort (KeyboardInput)
  participant Scenes as SceneMachine
  participant Sim as Simulation
  participant Pres as RunPresenter
  participant Render as RenderPort (CanvasRenderer)
  Browser->>Loop: onFrame
  Loop->>Clock: now()
  Note over Loop: accumulator += min(elapsed, 250 ms)
  loop while accumulator >= 1/60 s
    Loop->>Input: read(frame)
    Loop->>Scenes: step(frame)
    alt scene Run
      Scenes->>Sim: step(intent)
      Sim-->>Scenes: StepOutcome
      Scenes->>Pres: announce(outcome, audio)
      opt toppedOut
        Scenes->>Scenes: scene = GameOver
      end
    else Paused or GameOver
      Note over Scenes: Sim not stepped; Confirm or Pause changes scene
    end
  end
  Loop->>Scenes: render()
  Scenes->>Sim: view()
  Scenes->>Pres: draw(view, scene, port)
  Pres->>Render: clear, fillRect, drawText
  Browser-->>Loop: schedule next frame
```
