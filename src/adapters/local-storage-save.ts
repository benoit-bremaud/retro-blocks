import {
  HALL_SIZE,
  VOLUME_MAX,
  type Language,
  type SavePort,
  type ScoreEntry,
  type Settings,
} from '../domain/ports/save-port';

const SCORES_KEY = 'retro-blocks.v1.scores';
const SETTINGS_KEY = 'retro-blocks.v1.settings';
const DEFAULT_VOLUME = 2;

/** The slice of `Storage` the adapter needs; the composition root passes `localStorage`. */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isLanguage(value: unknown): value is Language {
  return value === 'en' || value === 'fr';
}

/** A stored line is kept only when every field has the expected shape; the rest is dropped. */
function toEntry(value: unknown): ScoreEntry | null {
  if (!isRecord(value)) return null;
  const { name, points, lines, level, seed } = value;
  if (typeof name !== 'string' || !/^[A-Z]{3}$/.test(name)) return null;
  if (!isCount(points) || !isCount(lines) || !isCount(level) || !isCount(seed)) return null;
  return { name, points, lines, level, seed };
}

/** Reads and parses `key`; any failure (no storage access, bad JSON) is `undefined`. */
function readJson(store: KeyValueStore, key: string): unknown {
  try {
    const raw = store.getItem(key);
    return raw === null ? undefined : (JSON.parse(raw) as unknown);
  } catch {
    return undefined;
  }
}

function writeJson(store: KeyValueStore, key: string, value: unknown): void {
  try {
    store.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or storage disabled: the game keeps running, only persistence is lost.
  }
}

/**
 * `SavePort` over `localStorage` (UML system/04-class-brick6). Stored data is untrusted: it is
 * validated field by field and anything wrong falls back to the defaults. `defaultLanguage` is the
 * first-run language, chosen by the composition root from the browser.
 */
export class LocalStorageSave implements SavePort {
  private readonly store: KeyValueStore;
  private readonly defaultLanguage: Language;

  constructor(store: KeyValueStore, defaultLanguage: Language) {
    this.store = store;
    this.defaultLanguage = defaultLanguage;
  }

  loadScores(): readonly ScoreEntry[] {
    const stored = readJson(this.store, SCORES_KEY);
    if (!Array.isArray(stored)) return [];
    const entries: ScoreEntry[] = [];
    for (let i = 0; i < stored.length && entries.length < HALL_SIZE; i += 1) {
      const entry = toEntry(stored[i]);
      if (entry !== null) entries.push(entry);
    }
    return entries.sort((a, b) => b.points - a.points);
  }

  saveScores(entries: readonly ScoreEntry[]): void {
    writeJson(this.store, SCORES_KEY, entries);
  }

  loadSettings(): Settings {
    const stored = readJson(this.store, SETTINGS_KEY);
    const defaults: Settings = {
      language: this.defaultLanguage,
      volume: DEFAULT_VOLUME,
      muted: false,
    };
    if (!isRecord(stored)) return defaults;
    const { language, volume, muted } = stored;
    return {
      language: isLanguage(language) ? language : defaults.language,
      volume: isCount(volume) && volume <= VOLUME_MAX ? volume : defaults.volume,
      muted: typeof muted === 'boolean' ? muted : defaults.muted,
    };
  }

  saveSettings(settings: Settings): void {
    writeJson(this.store, SETTINGS_KEY, settings);
  }
}
