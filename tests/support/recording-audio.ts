import type { AudioPort, SfxId } from '../../src/domain/ports/audio-port';

/** A fake audio output that records the sounds asked for. */
export class RecordingAudio implements AudioPort {
  readonly played: SfxId[] = [];

  readonly volumes: { level: number; muted: boolean }[] = [];

  play(sfx: SfxId): void {
    this.played.push(sfx);
  }

  setVolume(level: number, muted: boolean): void {
    this.volumes.push({ level, muted });
  }
}
