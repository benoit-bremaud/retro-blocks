import type { AudioPort, SfxId } from '../../src/domain/ports/audio-port';

/** A fake audio output that records the sounds asked for. */
export class RecordingAudio implements AudioPort {
  readonly played: SfxId[] = [];

  play(sfx: SfxId): void {
    this.played.push(sfx);
  }
}
