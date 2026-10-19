import { describe, expect, it } from 'vitest';
import type { AudioPort, SfxId } from '../../src/domain/ports/audio-port';
import { Intent, type IntentFrame } from '../../src/domain/ports/input-port';
import { SceneMachine } from '../../src/domain/scenes/scene-machine';
import { RecordingPort } from '../support/recording-port';

const IDLE: IntentFrame = { held: 0, pressed: 0 };
const press = (flag: number): IntentFrame => ({ held: flag, pressed: flag });

class RecordingAudio implements AudioPort {
  readonly played: SfxId[] = [];
  play(sfx: SfxId): void {
    this.played.push(sfx);
  }
}

function machine(seeds: number[] = [1, 2, 3]): {
  scenes: SceneMachine;
  port: RecordingPort;
  audio: RecordingAudio;
  used: () => number;
} {
  let next = 0;
  const port = new RecordingPort();
  const audio = new RecordingAudio();
  const scenes = new SceneMachine(() => seeds[next++ % seeds.length] ?? 0, port, audio);
  return { scenes, port, audio, used: () => next };
}

/** Hard drops until the stack reaches the top; bounded so a bug fails instead of hanging. */
function playToGameOver(scenes: SceneMachine): void {
  for (let i = 0; i < 400 && scenes.current !== 'GameOver'; i += 1)
    scenes.step(press(Intent.HardDrop));
}

describe('SceneMachine', () => {
  it('starts a run with the first seed and renders the field', () => {
    const { scenes, port, used } = machine();
    expect(scenes.current).toBe('Run');
    expect(used()).toBe(1);
    scenes.render();
    expect(port.clears).toHaveLength(1);
  });

  it('pauses on Pause, stops the simulation, and resumes on Pause', () => {
    const { scenes, port, audio } = machine();
    scenes.step(press(Intent.Pause));
    expect(scenes.current).toBe('Paused');
    scenes.step(press(Intent.HardDrop));
    expect(audio.played).toEqual([]);
    scenes.render();
    expect(port.hasText('PAUSED')).toBe(true);
    scenes.step(IDLE);
    expect(scenes.current).toBe('Paused');
    scenes.step(press(Intent.Pause));
    expect(scenes.current).toBe('Run');
  });

  it('plays the lock sound for a hard drop', () => {
    const { scenes, audio } = machine();
    scenes.step(press(Intent.HardDrop));
    expect(audio.played).toEqual(['lock']);
  });

  it('ends the run on top-out with a game over sound and a game over screen', () => {
    const { scenes, port, audio } = machine();
    playToGameOver(scenes);
    expect(scenes.current).toBe('GameOver');
    expect(audio.played.at(-1)).toBe('gameOver');
    scenes.render();
    expect(port.hasText('GAME OVER')).toBe(true);
  });

  it('retries on Confirm only, with a new seed', () => {
    const { scenes, used } = machine();
    playToGameOver(scenes);
    scenes.step(press(Intent.HardDrop));
    expect(scenes.current).toBe('GameOver');
    scenes.step(press(Intent.Confirm));
    expect(scenes.current).toBe('Run');
    expect(used()).toBe(2);
  });
});
