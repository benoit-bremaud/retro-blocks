import { qualifies } from '../hall-of-fame';
import { Simulation } from '../simulation';
import type { AudioPort } from '../ports/audio-port';
import { Intent, type IntentFrame } from '../ports/input-port';
import type { RenderPort } from '../ports/render-port';
import { SeededPrng } from '../random/seeded-prng';
import { RunPresenter, type SceneKind } from '../presentation/run-presenter';
import type { Scene, SceneContext, SceneId } from './scene';

const START_LEVEL = 1;

/**
 * A run (UML system/04-class-brick6): Run, Paused and the game over overlay. `enter` starts a new
 * `Simulation` with a fresh seed, so a retry is just entering the scene again. A run that tops out
 * with a qualifying score goes straight to the name entry; otherwise the game over overlay offers
 * a retry (Enter) or the menu (Esc).
 */
export class RunScene implements Scene {
  private readonly presenter = new RunPresenter();
  private readonly newSeed: () => number;
  private readonly context: SceneContext;
  private readonly port: RenderPort;
  private readonly audio: AudioPort;
  private seed = 0;
  private sim: Simulation;
  private state: SceneKind = 'Run';

  constructor(newSeed: () => number, context: SceneContext, port: RenderPort, audio: AudioPort) {
    this.newSeed = newSeed;
    this.context = context;
    this.port = port;
    this.audio = audio;
    this.sim = this.startRun();
  }

  /** What the scene shows: playing, paused or the game over overlay; read by tests. */
  get kind(): SceneKind {
    return this.state;
  }

  enter(): void {
    this.sim = this.startRun();
    this.state = 'Run';
  }

  step(frame: IntentFrame): SceneId | null {
    switch (this.state) {
      case 'Run':
        return this.stepRun(frame);
      case 'Paused':
        if ((frame.pressed & Intent.Pause) !== 0) this.state = 'Run';
        return null;
      case 'GameOver':
        if ((frame.pressed & Intent.Confirm) !== 0) return 'Run';
        return (frame.pressed & Intent.Pause) !== 0 ? 'Menu' : null;
    }
  }

  render(): void {
    this.presenter.draw(this.sim.view(), this.state, this.port, this.context.text);
  }

  private stepRun(frame: IntentFrame): SceneId | null {
    if ((frame.pressed & Intent.Pause) !== 0) {
      this.state = 'Paused';
      return null;
    }
    const outcome = this.sim.step(frame);
    this.presenter.announce(outcome, this.audio);
    if (!outcome.toppedOut) return null;
    const view = this.sim.view();
    this.context.lastRun = {
      points: view.points,
      lines: view.lines,
      level: view.level,
      seed: this.seed,
    };
    if (qualifies(this.context.scores, view.points)) return 'NameEntry';
    this.state = 'GameOver';
    return null;
  }

  private startRun(): Simulation {
    this.seed = this.newSeed();
    return new Simulation(new SeededPrng(this.seed), START_LEVEL);
  }
}
