import { AudioSynth, WebAudioTones } from '../adapters/audio-synth';
import { CanvasRenderer } from '../adapters/canvas-renderer';
import { KeyboardInput } from '../adapters/keyboard-input';
import { LocalStorageSave, type KeyValueStore } from '../adapters/local-storage-save';
import { PerformanceClock } from '../adapters/performance-clock';
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../domain/presentation/layout';
import { SceneMachine } from '../domain/scenes/scene-machine';
import { FrameLoop } from './frame-loop';
import { computeViewport } from './viewport';

// Composition root (ADR-0004): the only place that touches window and document.
const found = document.querySelector<HTMLCanvasElement>('#screen');
const context = found?.getContext('2d');
if (!found || !context) throw new Error('retro-blocks needs a 2D canvas');
const canvas = found;

const renderer = new CanvasRenderer(context);

/** Fits the canvas to the window at an integer scale; resizing a canvas clears it, the next frame redraws. */
function fitCanvas(): void {
  const ratio = globalThis.devicePixelRatio;
  const viewport = computeViewport(
    SCREEN_WIDTH,
    SCREEN_HEIGHT,
    globalThis.innerWidth,
    globalThis.innerHeight,
    ratio,
  );
  canvas.width = viewport.deviceWidth;
  canvas.height = viewport.deviceHeight;
  canvas.style.width = `${String(viewport.cssWidth)}px`;
  canvas.style.height = `${String(viewport.cssHeight)}px`;
  renderer.setScale(SCREEN_WIDTH, SCREEN_HEIGHT, viewport.scale);
}
fitCanvas();
globalThis.addEventListener('resize', fitCanvas);

const input = new KeyboardInput();
globalThis.addEventListener('keydown', (event) => {
  if (input.keyDown(event.code, event.repeat, event.metaKey)) event.preventDefault();
});
globalThis.addEventListener('keyup', (event) => {
  input.keyUp(event.code);
});
globalThis.addEventListener('blur', () => {
  input.releaseAll();
});

// Gameplay seed (UML system/01-component): one fresh seed per run, recorded with the score in the hall of fame.
const newSeed = (): number => crypto.getRandomValues(new Uint32Array(1))[0] ?? 0;

/** `localStorage`, or a throwaway in-memory store when the browser denies access (private mode, blocked site data). */
function openStore(): KeyValueStore {
  try {
    return globalThis.localStorage;
  } catch {
    const memory = new Map<string, string>();
    return {
      getItem: (key) => memory.get(key) ?? null,
      setItem: (key, value) => {
        memory.set(key, value);
      },
    };
  }
}

const save = new LocalStorageSave(
  openStore(),
  globalThis.navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en',
);
const audio = new AudioSynth(() =>
  typeof AudioContext === 'undefined' ? null : new WebAudioTones(new AudioContext()),
);

const scenes = new SceneMachine(newSeed, renderer, audio, save);
new FrameLoop(new PerformanceClock(), input, scenes, (callback) => {
  globalThis.requestAnimationFrame(callback);
}).start();
