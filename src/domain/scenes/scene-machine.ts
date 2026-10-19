import type { AudioPort } from '../ports/audio-port';
import type { FrameTarget } from '../ports/frame-target';
import type { IntentFrame } from '../ports/input-port';
import type { RenderPort } from '../ports/render-port';
import type { SavePort } from '../ports/save-port';
import { HallOfFameScene } from './hall-of-fame-scene';
import { MenuScene } from './menu-scene';
import { NameEntryScene } from './name-entry-scene';
import { RunScene } from './run-scene';
import { SceneContext, type Scene, type SceneId } from './scene';
import { SettingsScene } from './settings-scene';

/**
 * Owns the screens (UML gameplay/02-state, system/04-class-brick6) and delegates each step and
 * frame to the current one; a scene that returns another id is left and the target is entered.
 * The seed of each run comes from the injected source.
 */
export class SceneMachine implements FrameTarget {
  private readonly scenes: Readonly<Record<SceneId, Scene>>;
  private id: SceneId = 'Menu';

  constructor(newSeed: () => number, port: RenderPort, audio: AudioPort, save: SavePort) {
    const context = new SceneContext(save, audio);
    this.scenes = {
      Menu: new MenuScene(context, port),
      Settings: new SettingsScene(context, port),
      HallOfFame: new HallOfFameScene(context, port),
      NameEntry: new NameEntryScene(context, port),
      Run: new RunScene(newSeed, context, port, audio),
    };
  }

  /** The screen being shown; read by tests. */
  get current(): SceneId {
    return this.id;
  }

  step(frame: IntentFrame): void {
    const next = this.scenes[this.id].step(frame);
    if (next === null) return;
    this.id = next;
    this.scenes[next].enter();
  }

  render(): void {
    this.scenes[this.id].render();
  }
}
