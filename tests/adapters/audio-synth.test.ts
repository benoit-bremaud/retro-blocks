import { describe, expect, it } from 'vitest';
import {
  AudioSynth,
  WebAudioTones,
  type ContextLike,
  type ToneOutput,
} from '../../src/adapters/audio-synth';

class Tones implements ToneOutput {
  unlocks = 0;

  unlock(): void {
    this.unlocks += 1;
  }

  readonly calls: { hz: number; delay: number; gain: number }[] = [];

  tone(hz: number, delay: number, _seconds: number, _wave: string, gain: number): void {
    this.calls.push({ hz, delay, gain });
  }
}

function synth(): { audio: AudioSynth; tones: Tones; created: () => number } {
  const tones = new Tones();
  let created = 0;
  const audio = new AudioSynth(() => {
    created += 1;
    return tones;
  });
  return { audio, tones, created: () => created };
}

describe('AudioSynth', () => {
  it('plays the notes of an effect one after the other, scaled by the volume', () => {
    const { audio, tones } = synth();
    audio.setVolume(3, false);
    audio.play('clear2');
    expect(tones.calls.map((c) => c.hz)).toEqual([440, 550, 660]);
    expect(tones.calls[1]?.delay).toBeCloseTo(0.07);
    expect(tones.calls[0]?.gain).toBeGreaterThan(0);
    audio.setVolume(1, false);
    audio.play('lock');
    expect(tones.calls.at(-1)?.gain).toBeLessThan(tones.calls[0]?.gain ?? 0);
  });

  it('stays silent when muted or at volume 0, and creates nothing then', () => {
    const { audio, tones, created } = synth();
    audio.setVolume(2, true);
    audio.play('lock');
    audio.setVolume(0, false);
    audio.play('lock');
    expect(tones.calls).toEqual([]);
    expect(created()).toBe(0);
  });

  it('clamps an out-of-range volume', () => {
    const { audio, tones } = synth();
    audio.setVolume(99, false);
    audio.play('spin');
    audio.setVolume(3, false);
    audio.play('spin');
    expect(tones.calls[0]?.gain).toBe(tones.calls[1]?.gain);
    audio.setVolume(-4, false);
    audio.play('spin');
    expect(tones.calls).toHaveLength(2);
  });

  it('creates the output once, on the first sound', () => {
    const { audio, created } = synth();
    audio.setVolume(2, false);
    audio.play('lock');
    audio.play('lock');
    expect(created()).toBe(1);
  });

  it('degrades to silence when no output can be made, without retrying', () => {
    let attempts = 0;
    const missing = new AudioSynth(() => {
      attempts += 1;
      return null;
    });
    missing.setVolume(2, false);
    missing.play('lock');
    missing.play('lock');
    expect(attempts).toBe(1);
    const throwing = new AudioSynth(() => {
      throw new Error('blocked');
    });
    throwing.setVolume(2, false);
    expect(() => {
      throwing.play('lock');
    }).not.toThrow();
  });
});

describe('AudioSynth.unlock', () => {
  it('creates the output and unlocks it inside the gesture, even before any sound', () => {
    const { audio, tones, created } = synth();
    audio.unlock();
    expect(created()).toBe(1);
    expect(tones.unlocks).toBe(1);
  });
});

describe('WebAudioTones', () => {
  it('builds an oscillator with a fading gain and schedules it', () => {
    const log: string[] = [];
    const param = {
      value: 0,
      setValueAtTime: (v: number, t: number) => log.push(`set ${String(v)} ${String(t)}`),
      linearRampToValueAtTime: (v: number, t: number) => log.push(`ramp ${String(v)} ${String(t)}`),
    };
    const context: ContextLike = {
      currentTime: 10,
      destination: {},
      state: 'suspended',
      resume: () => {
        log.push('resume');
        return Promise.resolve();
      },
      createOscillator: () => ({
        type: 'sine',
        frequency: param,
        connect: () => log.push('osc connect'),
        start: (t) => log.push(`start ${String(t)}`),
        stop: (t) => log.push(`stop ${String(t)}`),
      }),
      createGain: () => ({ gain: param, connect: () => log.push('gain connect') }),
    };
    new WebAudioTones(context).tone(440, 1, 0.5, 'square', 0.1);
    expect(log).toEqual([
      'resume',
      'set 0.1 11',
      'ramp 0.0001 11.5',
      'osc connect',
      'gain connect',
      'start 11',
      'stop 11.5',
    ]);
    expect(param.value).toBe(440);
  });
});
