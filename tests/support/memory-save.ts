import type { SavePort, ScoreEntry, Settings } from '../../src/domain/ports/save-port';

/** A fake save that keeps scores and settings in memory and counts the writes. */
export class MemorySave implements SavePort {
  scores: readonly ScoreEntry[];
  settings: Settings;
  scoreWrites = 0;
  settingsWrites = 0;

  constructor(
    scores: readonly ScoreEntry[] = [],
    settings: Settings = { language: 'en', volume: 2, muted: false },
  ) {
    this.scores = scores;
    this.settings = settings;
  }

  loadScores(): readonly ScoreEntry[] {
    return this.scores;
  }

  saveScores(entries: readonly ScoreEntry[]): void {
    this.scores = entries;
    this.scoreWrites += 1;
  }

  loadSettings(): Settings {
    return this.settings;
  }

  saveSettings(settings: Settings): void {
    this.settings = settings;
    this.settingsWrites += 1;
  }
}
