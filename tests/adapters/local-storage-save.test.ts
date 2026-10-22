import { describe, expect, it } from 'vitest';
import { LocalStorageSave, type KeyValueStore } from '../../src/adapters/local-storage-save';

class FakeStore implements KeyValueStore {
  readonly data = new Map<string, string>();
  failReads = false;
  failWrites = false;

  getItem(key: string): string | null {
    if (this.failReads) throw new Error('denied');
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.failWrites) throw new Error('quota');
    this.data.set(key, value);
  }
}

const good = { name: 'ABC', points: 500, lines: 4, level: 2, seed: 9 };
const defaults = { language: 'en', volume: 2, muted: false };

describe('LocalStorageSave', () => {
  it('round-trips scores and settings', () => {
    const store = new FakeStore();
    const save = new LocalStorageSave(store, 'en');
    save.saveScores([good]);
    save.saveSettings({ language: 'fr', volume: 1, muted: true });
    const again = new LocalStorageSave(store, 'en');
    expect(again.loadScores()).toEqual([good]);
    expect(again.loadSettings()).toEqual({ language: 'fr', volume: 1, muted: true });
  });

  it('returns the defaults, with the given first-run language, when nothing is stored', () => {
    const save = new LocalStorageSave(new FakeStore(), 'fr');
    expect(save.loadScores()).toEqual([]);
    expect(save.loadSettings()).toEqual({ ...defaults, language: 'fr' });
  });

  it('survives unreadable storage and bad JSON', () => {
    const store = new FakeStore();
    store.failReads = true;
    const save = new LocalStorageSave(store, 'en');
    expect(save.loadScores()).toEqual([]);
    expect(save.loadSettings()).toEqual(defaults);
    store.failReads = false;
    store.data.set('retro-blocks.v1.scores', '{oops');
    store.data.set('retro-blocks.v1.settings', 'null');
    expect(save.loadScores()).toEqual([]);
    expect(save.loadSettings()).toEqual(defaults);
  });

  it('drops malformed lines, sorts and caps at ten', () => {
    const store = new FakeStore();
    const many = Array.from({ length: 12 }, (_, i) => ({ ...good, points: i + 1 }));
    store.data.set(
      'retro-blocks.v1.scores',
      JSON.stringify([
        { ...good, name: 'abc' },
        { ...good, points: -1 },
        { ...good, seed: 1.5 },
        'text',
        null,
        ...many,
      ]),
    );
    const scores = new LocalStorageSave(store, 'en').loadScores();
    expect(scores).toHaveLength(10);
    expect(scores[0]?.points).toBe(12);
    store.data.set('retro-blocks.v1.scores', '{"a":1}');
    expect(new LocalStorageSave(store, 'en').loadScores()).toEqual([]);
  });

  it('fixes each bad setting field on its own', () => {
    const store = new FakeStore();
    store.data.set(
      'retro-blocks.v1.settings',
      JSON.stringify({ language: 'de', volume: 9, muted: 'yes' }),
    );
    expect(new LocalStorageSave(store, 'en').loadSettings()).toEqual(defaults);
    store.data.set(
      'retro-blocks.v1.settings',
      JSON.stringify({ language: 'fr', volume: 0, muted: true }),
    );
    expect(new LocalStorageSave(store, 'en').loadSettings()).toEqual({
      language: 'fr',
      volume: 0,
      muted: true,
    });
  });

  it('drops a write that fails instead of throwing', () => {
    const store = new FakeStore();
    store.failWrites = true;
    const save = new LocalStorageSave(store, 'en');
    expect(() => {
      save.saveScores([good]);
      save.saveSettings({ language: 'en', volume: 2, muted: false });
    }).not.toThrow();
    expect(store.data.size).toBe(0);
    store.failWrites = false;
    save.saveScores([good]);
    expect(save.loadScores()).toEqual([good]);
  });
});
