import { describe, expect, it } from 'vitest';
import type { ActivePiece } from '../../src/domain/active-piece';
import type { SfxId } from '../../src/domain/ports/audio-port';
import { messages } from '../../src/domain/i18n/messages';
import { RunPresenter } from '../../src/domain/presentation/run-presenter';
import { CELL, FIELD_X, FIELD_Y, rowTop } from '../../src/domain/presentation/layout';
import { Palette } from '../../src/domain/presentation/palette';
import type { SimView, StepOutcome } from '../../src/domain/simulation';
import { RecordingAudio } from '../support/recording-audio';
import { RecordingPort } from '../support/recording-port';

const EN = messages('en');

function view(overrides: Partial<SimView> = {}, locked: Record<string, number> = {}): SimView {
  const active: ActivePiece = { kind: 'T', rotation: 0, x: 3, y: 10 };
  return {
    cells: {
      isOccupied: (x, y) => (locked[`${String(x)},${String(y)}`] ?? 0) !== 0,
      cellAt: (x, y) => locked[`${String(x)},${String(y)}`] ?? 0,
    },
    active,
    ghostY: 0,
    held: null,
    next: ['I', 'O', 'S', 'Z', 'J'],
    points: 1200,
    level: 3,
    lines: 14,
    phase: 'Falling',
    clearFrames: 0,
    clearingRows: [],
    ...overrides,
  };
}

/** Colour of a cell code; a function so the lookup is typed as possibly missing. */
function colourOf(code: number): string {
  return Palette.cell[code] ?? '';
}

function outcome(overrides: Partial<StepOutcome> = {}): StepOutcome {
  return { clearedRows: [], spin: 'None', locked: false, toppedOut: false, ...overrides };
}

describe('RunPresenter.announce', () => {
  const cases: [string, Partial<StepOutcome>, SfxId | null][] = [
    ['nothing for a step without a lock', {}, null],
    ['lock', { locked: true }, 'lock'],
    ['spin', { locked: true, spin: 'Full' }, 'spin'],
    ['a single', { locked: true, clearedRows: [3] }, 'clear1'],
    ['a double', { locked: true, clearedRows: [3, 4] }, 'clear2'],
    ['a triple', { locked: true, clearedRows: [3, 4, 5] }, 'clear3'],
    [
      'four lines, spin or not',
      { locked: true, spin: 'Full', clearedRows: [3, 4, 5, 6] },
      'clear4',
    ],
    ['game over, even on a lock', { locked: true, toppedOut: true }, 'gameOver'],
    ['game over without a lock (block out on hold)', { toppedOut: true }, 'gameOver'],
  ];
  it.each(cases)('plays the right sound: %s', (_name, step, expected) => {
    const audio = new RecordingAudio();
    new RunPresenter().announce(outcome(step), audio);
    expect(audio.played).toEqual(expected === null ? [] : [expected]);
  });
});

describe('RunPresenter.draw', () => {
  it('clears the screen and draws a locked cell in its kind colour at its pixel', () => {
    const port = new RecordingPort();
    new RunPresenter().draw(view({}, { '0,0': 1 }), 'Run', port, EN);
    expect(port.clears).toEqual([Palette.background]);
    expect(port.hasRect(FIELD_X, rowTop(0), CELL, CELL, colourOf(1))).toBe(true);
  });

  it('draws cells of the spawn margin above the visible field', () => {
    const port = new RecordingPort();
    new RunPresenter().draw(view({}, { '4,21': 3 }), 'Run', port, EN);
    expect(rowTop(21)).toBeLessThan(FIELD_Y);
    expect(port.hasRect(FIELD_X + 4 * CELL, rowTop(21), CELL, CELL, colourOf(3))).toBe(true);
  });

  it('draws the active piece and its ghost when they differ', () => {
    const port = new RecordingPort();
    new RunPresenter().draw(view({ ghostY: 0 }), 'Run', port, EN);
    // T rotation 0 holds (1, 2): active at row 12, ghost at row 2, in column 4.
    expect(port.hasRect(FIELD_X + 4 * CELL, rowTop(12), CELL, CELL, colourOf(3))).toBe(true);
    expect(port.hasRect(FIELD_X + 4 * CELL, rowTop(2), CELL, CELL, Palette.ghost)).toBe(true);
  });

  it('skips the ghost when it sits on the piece', () => {
    const port = new RecordingPort();
    new RunPresenter().draw(view({ ghostY: 10 }), 'Run', port, EN);
    expect(port.rects.some((r) => r.colour === Palette.ghost)).toBe(false);
  });

  it('does not draw the active piece again while Clearing', () => {
    const port = new RecordingPort();
    new RunPresenter().draw(
      view({ phase: 'Clearing', clearFrames: 10, ghostY: 10 }),
      'Run',
      port,
      EN,
    );
    expect(port.hasRect(FIELD_X + 4 * CELL, rowTop(12), CELL, CELL, colourOf(3))).toBe(false);
  });

  it('flashes the clearing rows on alternating blocks of 4 steps', () => {
    const rows = [5, 6];
    const lit = new RecordingPort();
    new RunPresenter().draw(
      view({ phase: 'Clearing', clearFrames: 16, clearingRows: rows }),
      'Run',
      lit,
      EN,
    );
    expect(lit.hasRect(FIELD_X, rowTop(5), 160, CELL, Palette.flash)).toBe(true);
    expect(lit.hasRect(FIELD_X, rowTop(6), 160, CELL, Palette.flash)).toBe(true);
    const dark = new RecordingPort();
    new RunPresenter().draw(
      view({ phase: 'Clearing', clearFrames: 12, clearingRows: rows }),
      'Run',
      dark,
      EN,
    );
    expect(dark.rects.some((r) => r.colour === Palette.flash)).toBe(false);
  });

  it('writes score, level and lines, and follows a change', () => {
    const presenter = new RunPresenter();
    const first = new RecordingPort();
    presenter.draw(view(), 'Run', first, EN);
    expect(first.hasText('1200')).toBe(true);
    expect(first.hasText('3')).toBe(true);
    expect(first.hasText('14')).toBe(true);
    const second = new RecordingPort();
    presenter.draw(view({ points: 1300 }), 'Run', second, EN);
    expect(second.hasText('1300')).toBe(true);
    expect(second.hasText('14')).toBe(true);
  });

  it('draws five next pieces and the held piece only when there is one', () => {
    const none = new RecordingPort();
    new RunPresenter().draw(view(), 'Run', none, EN);
    const withHold = new RecordingPort();
    new RunPresenter().draw(view({ held: 'L' }), 'Run', withHold, EN);
    const lCell = colourOf(7);
    expect(none.rects.some((r) => r.colour === lCell)).toBe(false);
    expect(withHold.rects.filter((r) => r.colour === lCell && r.width === 12)).toHaveLength(4);
    // Five slots: I O S Z J, four cells each.
    expect(none.rects.filter((r) => r.width === 12 && r.height === 12)).toHaveLength(20);
  });

  it('centres the I preview in its next slot and the pause title in the field', () => {
    const port = new RecordingPort();
    new RunPresenter().draw(view(), 'Paused', port, EN);
    // The first next piece is an I: four 12 px cells side by side from x 256, at y 70.
    for (let i = 0; i < 4; i += 1)
      expect(port.hasRect(256 + i * 12, 70, 12, 12, colourOf(1))).toBe(true);
    // "PAUSED" at scale 2 is 46 px wide: centred on the field's middle x 160, above its middle y 192.
    expect(port.texts.find((t) => t.text === 'PAUSED')).toMatchObject({ x: 137, y: 180, scale: 2 });
    expect(port.hasText('PRESS P')).toBe(true);
  });

  it('shows the pause and game over overlays', () => {
    const paused = new RecordingPort();
    new RunPresenter().draw(view(), 'Paused', paused, EN);
    expect(paused.hasText('PAUSED')).toBe(true);
    const over = new RecordingPort();
    new RunPresenter().draw(view(), 'GameOver', over, EN);
    expect(over.hasText('GAME OVER')).toBe(true);
    expect(over.hasText('PRESS ENTER')).toBe(true);
    const running = new RecordingPort();
    new RunPresenter().draw(view(), 'Run', running, EN);
    expect(running.hasText('PAUSED')).toBe(false);
  });
});
