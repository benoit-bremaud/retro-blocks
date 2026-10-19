import { describe, expect, it } from 'vitest';
import { KeyboardInput } from '../../src/adapters/keyboard-input';
import { Intent, type MutableIntentFrame } from '../../src/domain/ports/input-port';

function read(input: KeyboardInput): MutableIntentFrame {
  const frame: MutableIntentFrame = { held: 0, pressed: 0 };
  input.read(frame);
  return frame;
}

describe('KeyboardInput', () => {
  it('reports a key as pressed once and held while down', () => {
    const input = new KeyboardInput();
    input.keyDown('ArrowLeft', false);
    expect(read(input)).toEqual({ held: Intent.Left, pressed: Intent.Left });
    expect(read(input)).toEqual({ held: Intent.Left, pressed: 0 });
    input.keyUp('ArrowLeft');
    expect(read(input)).toEqual({ held: 0, pressed: 0 });
  });

  it('keeps a tap shorter than a step: pressed and held for that read', () => {
    const input = new KeyboardInput();
    input.keyDown('Space', false);
    input.keyUp('Space');
    expect(read(input)).toEqual({ held: Intent.HardDrop, pressed: Intent.HardDrop });
    expect(read(input)).toEqual({ held: 0, pressed: 0 });
  });

  it('ignores auto-repeat for the press but still prevents the page default', () => {
    const input = new KeyboardInput();
    input.keyDown('ArrowDown', false);
    read(input);
    expect(input.keyDown('ArrowDown', true)).toBe(true);
    expect(read(input)).toEqual({ held: Intent.SoftDrop, pressed: 0 });
  });

  it('treats two keys of one intent as one until both are released', () => {
    const input = new KeyboardInput();
    input.keyDown('ArrowUp', false);
    input.keyDown('KeyX', false);
    input.keyUp('ArrowUp');
    expect(read(input).held & Intent.RotateCw).toBe(Intent.RotateCw);
    input.keyUp('KeyX');
    expect(read(input).held).toBe(0);
  });

  it('ignores a key pressed with Cmd held and releases the others', () => {
    const input = new KeyboardInput();
    input.keyDown('ArrowLeft', false);
    expect(input.keyDown('KeyZ', false, true)).toBe(false);
    expect(read(input)).toEqual({ held: Intent.Left, pressed: Intent.Left });
    expect(read(input)).toEqual({ held: 0, pressed: 0 });
    // The Z that Cmd swallowed does not block the next real press.
    input.keyDown('KeyZ', false);
    expect(read(input).pressed).toBe(Intent.RotateCcw);
  });

  it('maps every game key to its intent', () => {
    const expected: [string, number][] = [
      ['ArrowLeft', Intent.Left],
      ['ArrowDown', Intent.SoftDrop],
      ['Space', Intent.HardDrop],
      ['ArrowUp', Intent.RotateCw],
      ['KeyX', Intent.RotateCw],
      ['ShiftRight', Intent.Hold],
      ['ArrowRight', Intent.Right],
      ['KeyZ', Intent.RotateCcw],
      ['KeyC', Intent.Hold],
      ['ShiftLeft', Intent.Hold],
      ['KeyP', Intent.Pause],
      ['Escape', Intent.Pause],
      ['Enter', Intent.Confirm],
      ['NumpadEnter', Intent.Confirm],
    ];
    for (const [code, flag] of expected) {
      const input = new KeyboardInput();
      input.keyDown(code, false);
      expect(read(input).pressed).toBe(flag);
    }
  });

  it('prevents the default of mapped keys, except Escape, and ignores the others', () => {
    const input = new KeyboardInput();
    expect(input.keyDown('Space', false)).toBe(true);
    expect(input.keyDown('Escape', false)).toBe(false);
    expect(input.keyDown('KeyQ', false)).toBe(false);
    input.keyUp('KeyQ');
    expect(read(input).pressed).toBe(Intent.HardDrop | Intent.Pause);
  });

  it('releases every key on focus loss but keeps the latched presses', () => {
    const input = new KeyboardInput();
    input.keyDown('ArrowRight', false);
    input.releaseAll();
    expect(read(input)).toEqual({ held: Intent.Right, pressed: Intent.Right });
    expect(read(input)).toEqual({ held: 0, pressed: 0 });
    input.keyUp('ArrowRight');
    expect(read(input).held).toBe(0);
  });
});
