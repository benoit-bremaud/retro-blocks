import { describe, expect, it } from 'vitest';
import { Intent, type IntentFrame } from '../../src/domain/ports/input-port';
import type { ScoreEntry, Settings } from '../../src/domain/ports/save-port';
import { Palette } from '../../src/domain/presentation/palette';
import { SceneMachine } from '../../src/domain/scenes/scene-machine';
import { MemorySave } from '../support/memory-save';
import { RecordingAudio } from '../support/recording-audio';
import { RecordingPort } from '../support/recording-port';

const IDLE: IntentFrame = { held: 0, pressed: 0 };
const press = (flag: number): IntentFrame => ({ held: flag, pressed: flag });
const OK = Intent.Confirm;
const UP = Intent.RotateCw;
const DOWN = Intent.SoftDrop;

const line = (points: number, name = 'AAA'): ScoreEntry => ({
  name,
  points,
  lines: 0,
  level: 1,
  seed: 5,
});

function machine(
  save = new MemorySave(),
  seeds: number[] = [1, 2, 3],
): {
  scenes: SceneMachine;
  port: RecordingPort;
  audio: RecordingAudio;
  save: MemorySave;
  used: () => number;
  shows: (text: string) => boolean;
} {
  let next = 0;
  const port = new RecordingPort();
  const audio = new RecordingAudio();
  const scenes = new SceneMachine(() => seeds[next++ % seeds.length] ?? 0, port, audio, save);
  const shows = (text: string): boolean => {
    port.texts.length = 0;
    scenes.render();
    return port.hasText(text);
  };
  return { scenes, port, audio, save, used: () => next, shows };
}

/** Menu → Run. */
function startRun(scenes: SceneMachine): void {
  scenes.step(press(OK));
}

/** Hard drops until the stack reaches the top; bounded so a bug fails instead of hanging. */
function topOut(scenes: SceneMachine): void {
  for (let i = 0; i < 400 && scenes.current === 'Run'; i += 1) scenes.step(press(Intent.HardDrop));
}

describe('menu', () => {
  it('opens on the menu and draws the title and the three choices', () => {
    const { scenes, shows } = machine();
    expect(scenes.current).toBe('Menu');
    expect(shows('RETRO BLOCKS')).toBe(true);
    expect(shows('START')).toBe(true);
    expect(shows('HALL OF FAME')).toBe(true);
    expect(shows('SETTINGS')).toBe(true);
  });

  it('moves the cursor with down and up, wrapping, and opens the chosen screen', () => {
    const { scenes } = machine();
    scenes.step(press(DOWN));
    scenes.step(press(OK));
    expect(scenes.current).toBe('HallOfFame');
    scenes.step(press(OK));
    expect(scenes.current).toBe('Menu');
    scenes.step(press(DOWN));
    scenes.step(press(OK));
    expect(scenes.current).toBe('Settings');
    scenes.step(press(Intent.Pause));
    scenes.step(press(DOWN));
    scenes.step(press(DOWN));
    scenes.step(press(UP));
    scenes.step(press(UP));
    scenes.step(press(OK));
    expect(scenes.current).toBe('Settings');
  });

  it('ignores a frame with nothing pressed and highlights the selected row', () => {
    const { scenes, port } = machine();
    scenes.step(IDLE);
    expect(scenes.current).toBe('Menu');
    scenes.render();
    expect(port.rects.some((r) => r.colour === Palette.flash && r.width === 8)).toBe(true);
  });
});

describe('run', () => {
  it('starts a run with a fresh seed from the menu', () => {
    const { scenes, port, used } = machine();
    const before = used();
    startRun(scenes);
    expect(scenes.current).toBe('Run');
    expect(used()).toBe(before + 1);
    scenes.render();
    expect(port.hasText('SCORE')).toBe(true);
  });

  it('pauses on Pause, stops the simulation, and resumes on Pause', () => {
    const { scenes, audio, shows } = machine();
    startRun(scenes);
    scenes.step(press(Intent.Pause));
    scenes.step(press(Intent.HardDrop));
    expect(audio.played).toEqual([]);
    expect(shows('PAUSED')).toBe(true);
    scenes.step(IDLE);
    expect(shows('PAUSED')).toBe(true);
    scenes.step(press(Intent.Pause));
    expect(shows('PAUSED')).toBe(false);
  });

  it('plays the lock sound for a hard drop', () => {
    const { scenes, audio } = machine();
    startRun(scenes);
    scenes.step(press(Intent.HardDrop));
    expect(audio.played).toEqual(['lock']);
  });

  it('lets Pause win over a hard drop pressed on the same step', () => {
    const { scenes, audio, shows } = machine();
    startRun(scenes);
    scenes.step(press(Intent.Pause | Intent.HardDrop));
    expect(audio.played).toEqual([]);
    expect(shows('PAUSED')).toBe(true);
  });

  it('ignores Confirm during a run', () => {
    const { scenes } = machine();
    startRun(scenes);
    scenes.step(press(OK));
    expect(scenes.current).toBe('Run');
  });

  it('shows game over when the score does not qualify, retries on Confirm only', () => {
    const full = Array.from({ length: 10 }, () => line(9_999_999));
    const { scenes, audio, shows, used } = machine(new MemorySave(full));
    startRun(scenes);
    topOut(scenes);
    expect(scenes.current).toBe('Run');
    expect(audio.played.at(-1)).toBe('gameOver');
    expect(shows('GAME OVER')).toBe(true);
    expect(shows('ESC MENU')).toBe(true);
    scenes.step(press(Intent.HardDrop));
    expect(shows('GAME OVER')).toBe(true);
    const seeds = used();
    scenes.step(press(OK));
    expect(used()).toBe(seeds + 1);
    expect(shows('GAME OVER')).toBe(false);
  });

  it('leaves the game over screen for the menu on Esc', () => {
    const full = Array.from({ length: 10 }, () => line(9_999_999));
    const { scenes } = machine(new MemorySave(full));
    startRun(scenes);
    topOut(scenes);
    scenes.step(press(Intent.Pause));
    expect(scenes.current).toBe('Menu');
  });

  it('starts a retry on an empty field', () => {
    const full = Array.from({ length: 10 }, () => line(9_999_999));
    const { scenes, port } = machine(new MemorySave(full));
    startRun(scenes);
    topOut(scenes);
    scenes.step(press(OK));
    port.rects.length = 0;
    scenes.render();
    expect(
      port.rects.some(
        (r) => r.y === 336 && r.width === 16 && r.height === 16 && r.colour !== Palette.ghost,
      ),
    ).toBe(false);
  });
});

describe('name entry and hall of fame', () => {
  function toNameEntry(save = new MemorySave()): ReturnType<typeof machine> {
    const m = machine(save);
    startRun(m.scenes);
    // A first hard drop scores points (hard drop distance), so the run qualifies on an empty table.
    topOut(m.scenes);
    return m;
  }

  it('goes to the name entry when the score qualifies', () => {
    const { scenes, shows } = toNameEntry();
    expect(scenes.current).toBe('NameEntry');
    expect(shows('NEW RECORD')).toBe(true);
    expect(shows('AAA')).toBe(true);
  });

  it('edits three letters, saves on the last Confirm and shows the table', () => {
    const { scenes, save, shows } = toNameEntry();
    scenes.step(press(UP));
    scenes.step(press(OK));
    scenes.step(press(DOWN));
    scenes.step(press(Intent.Right));
    scenes.step(press(Intent.Left));
    scenes.step(press(Intent.Right));
    scenes.step(press(UP));
    scenes.step(press(UP));
    expect(save.scoreWrites).toBe(0);
    scenes.step(press(OK));
    expect(scenes.current).toBe('HallOfFame');
    expect(save.scores).toHaveLength(1);
    expect(save.scores[0]?.name).toBe('BZC');
    expect(save.scores[0]?.seed).toBeGreaterThan(0);
    expect(shows(' 1 BZC' + String(save.scores[0]?.points).padStart(9, ' '))).toBe(true);
  });

  it('wraps a letter past A and Z, and clamps the cursor at both ends', () => {
    const { scenes, shows } = toNameEntry();
    scenes.step(press(Intent.Left));
    scenes.step(press(DOWN));
    expect(shows('ZAA')).toBe(true);
    scenes.step(press(Intent.Right));
    scenes.step(press(Intent.Right));
    scenes.step(press(Intent.Right));
    scenes.step(press(UP));
    expect(shows('ZAB')).toBe(true);
    scenes.step(press(UP));
    scenes.step(press(UP));
    expect(shows('ZAB')).toBe(false);
  });

  it('skips on Esc without saving', () => {
    const { scenes, save } = toNameEntry();
    scenes.step(press(Intent.Pause));
    expect(scenes.current).toBe('HallOfFame');
    expect(save.scoreWrites).toBe(0);
  });

  it('keeps ten lines, highest first, and leaves with Confirm or Esc', () => {
    const table = Array.from({ length: 10 }, (_, i) => line(1 + i, 'OLD'));
    const m = machine(new MemorySave(table));
    startRun(m.scenes);
    topOut(m.scenes);
    expect(m.scenes.current).toBe('NameEntry');
    for (let i = 0; i < 3; i += 1) m.scenes.step(press(OK));
    expect(m.save.scores).toHaveLength(10);
    expect(m.save.scores[0]?.name).toBe('AAA');
    m.scenes.step(IDLE);
    expect(m.scenes.current).toBe('HallOfFame');
    m.scenes.step(press(Intent.Pause));
    expect(m.scenes.current).toBe('Menu');
  });

  it('says so when the table is empty', () => {
    const { scenes, shows } = machine();
    scenes.step(press(DOWN));
    scenes.step(press(OK));
    expect(shows('NO SCORES YET')).toBe(true);
  });
});

describe('settings', () => {
  function inSettings(settings?: Settings): ReturnType<typeof machine> {
    const m = machine(new MemorySave([], settings));
    m.scenes.step(press(UP));
    m.scenes.step(press(OK));
    return m;
  }

  it('applies the saved volume to the audio at start', () => {
    const { audio } = machine(new MemorySave([], { language: 'en', volume: 1, muted: true }));
    expect(audio.volumes).toEqual([{ level: 1, muted: true }]);
  });

  it('switches the language, saves it, and the screens follow', () => {
    const { scenes, save, shows } = inSettings();
    expect(scenes.current).toBe('Settings');
    scenes.step(press(Intent.Right));
    expect(save.settings.language).toBe('fr');
    expect(shows('OPTIONS')).toBe(true);
    scenes.step(press(Intent.Left));
    expect(save.settings.language).toBe('en');
    scenes.step(press(OK));
    expect(save.settings.language).toBe('fr');
  });

  it('changes the volume within 0 and 3 and pushes it to the audio', () => {
    const { scenes, save, audio } = inSettings();
    scenes.step(press(DOWN));
    scenes.step(press(Intent.Right));
    scenes.step(press(Intent.Right));
    expect(save.settings.volume).toBe(3);
    for (let i = 0; i < 5; i += 1) scenes.step(press(Intent.Left));
    expect(save.settings.volume).toBe(0);
    expect(audio.volumes.at(-1)).toEqual({ level: 0, muted: false });
  });

  it('toggles the sound and shows ON or OFF', () => {
    const { scenes, save, shows } = inSettings();
    scenes.step(press(DOWN));
    scenes.step(press(DOWN));
    expect(shows('ON')).toBe(true);
    scenes.step(press(OK));
    expect(save.settings.muted).toBe(true);
    expect(shows('OFF')).toBe(true);
  });

  it('goes back from the BACK row with Confirm, from anywhere with Esc, and ignores idle frames', () => {
    const { scenes } = inSettings();
    scenes.step(IDLE);
    expect(scenes.current).toBe('Settings');
    scenes.step(press(UP));
    scenes.step(IDLE);
    expect(scenes.current).toBe('Settings');
    scenes.step(press(OK));
    expect(scenes.current).toBe('Menu');
    scenes.step(press(UP));
    scenes.step(press(OK));
    scenes.step(press(Intent.Pause));
    expect(scenes.current).toBe('Menu');
  });
});
