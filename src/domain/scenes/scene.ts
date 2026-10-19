import type { AudioPort } from '../ports/audio-port';
import type { IntentFrame } from '../ports/input-port';
import type { SavePort, ScoreEntry, Settings } from '../ports/save-port';
import { messages, type MessageSet } from '../i18n/messages';

/** The screens of the game (UML system/04-class-brick6). */
export type SceneId = 'Menu' | 'Settings' | 'HallOfFame' | 'NameEntry' | 'Run';

/** What the last finished run scored; read by the name entry. */
export interface RunResult {
  readonly points: number;
  readonly lines: number;
  readonly level: number;
  readonly seed: number;
}

/** One screen. `step` returns the next screen, or `null` to stay; `enter` runs when the screen is shown. */
export interface Scene {
  enter(): void;
  step(frame: IntentFrame): SceneId | null;
  render(): void;
}

/** State shared by the scenes: settings, scores, the last run, and the ports that persist or play them. */
export class SceneContext {
  settings: Settings;
  scores: readonly ScoreEntry[];
  lastRun: RunResult | null = null;
  private readonly save: SavePort;
  private readonly audio: AudioPort;

  constructor(save: SavePort, audio: AudioPort) {
    this.save = save;
    this.audio = audio;
    this.settings = save.loadSettings();
    this.scores = save.loadScores();
    audio.setVolume(this.settings.volume, this.settings.muted);
  }

  /** The strings of the current language. */
  get text(): MessageSet {
    return messages(this.settings.language);
  }

  /** Applies and saves new settings, and updates the audio output. */
  updateSettings(next: Settings): void {
    this.settings = next;
    this.save.saveSettings(next);
    this.audio.setVolume(next.volume, next.muted);
  }

  /** Replaces and saves the score table. */
  updateScores(next: readonly ScoreEntry[]): void {
    this.scores = next;
    this.save.saveScores(next);
  }
}
