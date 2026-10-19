import { Simulation } from '../simulation';
import type { AudioPort } from '../ports/audio-port';
import type { FrameTarget } from '../ports/frame-target';
import { Intent, type IntentFrame } from '../ports/input-port';
import type { RenderPort } from '../ports/render-port';
import { SeededPrng } from '../random/seeded-prng';
import { RunPresenter, type SceneKind } from '../presentation/run-presenter';

const START_LEVEL = 1;

/**
 * The scenes of a run (UML gameplay/02-state, brick 5 subset): Run, Paused and GameOver. A new
 * `Simulation` is created per run and per retry with a fresh seed from the injected source. While
 * Paused or after the game is over the simulation is not stepped, and the frame still renders.
 */
export class SceneMachine implements FrameTarget {
  private readonly presenter = new RunPresenter();
  private readonly newSeed: () => number;
  private readonly port: RenderPort;
  private readonly audio: AudioPort;
  private sim: Simulation;
  private scene: SceneKind = 'Run';

  constructor(newSeed: () => number, port: RenderPort, audio: AudioPort) {
    this.newSeed = newSeed;
    this.port = port;
    this.audio = audio;
    this.sim = this.startRun();
  }

  /** The scene being played; read by tests. */
  get current(): SceneKind {
    return this.scene;
  }

  step(frame: IntentFrame): void {
    switch (this.scene) {
      case 'Run':
        this.stepRun(frame);
        break;
      case 'Paused':
        if ((frame.pressed & Intent.Pause) !== 0) this.scene = 'Run';
        break;
      case 'GameOver':
        if ((frame.pressed & Intent.Confirm) !== 0) {
          this.sim = this.startRun();
          this.scene = 'Run';
        }
        break;
    }
  }

  render(): void {
    this.presenter.draw(this.sim.view(), this.scene, this.port);
  }

  private stepRun(frame: IntentFrame): void {
    if ((frame.pressed & Intent.Pause) !== 0) {
      this.scene = 'Paused';
      return;
    }
    const outcome = this.sim.step(frame);
    this.presenter.announce(outcome, this.audio);
    if (outcome.toppedOut) this.scene = 'GameOver';
  }

  private startRun(): Simulation {
    return new Simulation(new SeededPrng(this.newSeed()), START_LEVEL);
  }
}
