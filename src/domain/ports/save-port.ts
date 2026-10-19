/** Languages the game ships (UML system/04-class-brick6). */
export type Language = 'en' | 'fr';

/** Player settings, saved at each change. */
export interface Settings {
  readonly language: Language;
  /** Master volume, 0 (silent) to `VOLUME_MAX`. */
  readonly volume: number;
  readonly muted: boolean;
}

/** Highest master volume step. */
export const VOLUME_MAX = 3;

/** Number of lines kept in the hall of fame (GDD §8). */
export const HALL_SIZE = 10;

/** One line of the hall of fame; `seed` is kept so a run can be replayed later. */
export interface ScoreEntry {
  /** Three capital letters. */
  readonly name: string;
  readonly points: number;
  readonly lines: number;
  readonly level: number;
  readonly seed: number;
}

/**
 * Persistence of scores and settings. Loading never throws: missing, corrupt or unreadable data
 * gives the defaults, and a failed save is dropped (the game keeps running).
 */
export interface SavePort {
  loadScores(): readonly ScoreEntry[];
  saveScores(entries: readonly ScoreEntry[]): void;
  loadSettings(): Settings;
  saveSettings(settings: Settings): void;
}
