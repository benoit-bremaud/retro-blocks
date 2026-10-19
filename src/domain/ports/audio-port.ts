/** The sound effects the game asks for; the adapter decides what each one sounds like. */
export type SfxId = 'lock' | 'clear1' | 'clear2' | 'clear3' | 'clear4' | 'spin' | 'gameOver';

/** Sound output of the game. */
export interface AudioPort {
  play(sfx: SfxId): void;
}

/** The silence: what the game plays through until an audio adapter is wired (brick 6, tests). */
export const SILENT_AUDIO: AudioPort = {
  play: () => undefined,
};
