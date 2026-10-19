import type { AudioPort, SfxId } from '../domain/ports/audio-port';
import { VOLUME_MAX } from '../domain/ports/save-port';

type Wave = 'square' | 'triangle' | 'sawtooth';

interface Note {
  readonly hz: number;
  readonly seconds: number;
  readonly wave: Wave;
}

const STEP = 0.07;

/** The notes of each effect, played one after the other. */
const SFX: Readonly<Record<SfxId, readonly Note[]>> = {
  lock: [{ hz: 110, seconds: 0.05, wave: 'square' }],
  spin: [{ hz: 880, seconds: 0.04, wave: 'triangle' }],
  clear1: [
    { hz: 440, seconds: STEP, wave: 'square' },
    { hz: 660, seconds: STEP, wave: 'square' },
  ],
  clear2: [
    { hz: 440, seconds: STEP, wave: 'square' },
    { hz: 550, seconds: STEP, wave: 'square' },
    { hz: 660, seconds: STEP, wave: 'square' },
  ],
  clear3: [
    { hz: 440, seconds: STEP, wave: 'square' },
    { hz: 550, seconds: STEP, wave: 'square' },
    { hz: 660, seconds: STEP, wave: 'square' },
    { hz: 880, seconds: STEP, wave: 'square' },
  ],
  clear4: [
    { hz: 440, seconds: STEP, wave: 'triangle' },
    { hz: 660, seconds: STEP, wave: 'triangle' },
    { hz: 880, seconds: STEP, wave: 'triangle' },
    { hz: 1100, seconds: 3 * STEP, wave: 'triangle' },
  ],
  gameOver: [
    { hz: 330, seconds: 0.18, wave: 'sawtooth' },
    { hz: 262, seconds: 0.18, wave: 'sawtooth' },
    { hz: 196, seconds: 0.18, wave: 'sawtooth' },
    { hz: 147, seconds: 0.4, wave: 'sawtooth' },
  ],
};

/** Master gain per volume step (0 is silent). */
const GAIN: readonly number[] = [0, 0.04, 0.09, 0.16];

/** Where tones are produced: the real one is the Web Audio API, a test passes a recorder. */
export interface ToneOutput {
  /** Plays one tone starting `delay` seconds from now, with a short fade-out. */
  tone(hz: number, delay: number, seconds: number, wave: Wave, gain: number): void;
}

/**
 * `AudioPort` as chip-style synthesis: no sound file. Volume and mute are applied here, the
 * tones go to a `ToneOutput` created lazily on the first sound, which always follows a key press
 * (browser autoplay policy).
 */
export class AudioSynth implements AudioPort {
  private readonly create: () => ToneOutput | null;
  private output: ToneOutput | null = null;
  private failed = false;
  private level = 0;
  private muted = false;

  constructor(create: () => ToneOutput | null) {
    this.create = create;
  }

  setVolume(level: number, muted: boolean): void {
    this.level = Math.min(VOLUME_MAX, Math.max(0, Math.trunc(level)));
    this.muted = muted;
  }

  play(sfx: SfxId): void {
    const gain = GAIN[this.level] ?? 0;
    if (this.muted || gain === 0) return;
    const output = this.ensureOutput();
    if (output === null) return;
    let delay = 0;
    const notes = SFX[sfx];
    for (let i = 0; i < notes.length; i += 1) {
      const note = notes[i];
      if (note === undefined) continue;
      output.tone(note.hz, delay, note.seconds, note.wave, gain);
      delay += note.seconds;
    }
  }

  private ensureOutput(): ToneOutput | null {
    if (this.output === null && !this.failed) {
      try {
        this.output = this.create();
      } catch {
        this.output = null;
      }
      this.failed = this.output === null;
    }
    return this.output;
  }
}

/** The slice of `AudioContext` that `WebAudioTones` uses. */
export interface ContextLike {
  readonly currentTime: number;
  readonly destination: object;
  resume(): Promise<void>;
  createOscillator(): {
    type: OscillatorType;
    readonly frequency: { value: number };
    connect(target: object): void;
    start(when: number): void;
    stop(when: number): void;
  };
  createGain(): {
    readonly gain: {
      setValueAtTime(value: number, when: number): unknown;
      linearRampToValueAtTime(value: number, when: number): unknown;
    };
    connect(target: object): void;
  };
}

/** Tones through the Web Audio API: one oscillator and one gain envelope per note. */
export class WebAudioTones implements ToneOutput {
  private readonly context: ContextLike;

  constructor(context: ContextLike) {
    this.context = context;
  }

  tone(hz: number, delay: number, seconds: number, wave: Wave, gain: number): void {
    const { context } = this;
    void context.resume();
    const start = context.currentTime + delay;
    const end = start + seconds;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = wave;
    oscillator.frequency.value = hz;
    envelope.gain.setValueAtTime(gain, start);
    envelope.gain.linearRampToValueAtTime(0.0001, end);
    oscillator.connect(envelope);
    envelope.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(end);
  }
}
