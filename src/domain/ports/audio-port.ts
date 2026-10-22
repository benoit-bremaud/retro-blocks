/** The sound effects the game asks for; the adapter decides what each one sounds like. */
export type SfxId = 'lock' | 'clear1' | 'clear2' | 'clear3' | 'clear4' | 'spin' | 'gameOver';

/** Sound output of the game. */
export interface AudioPort {
  play(sfx: SfxId): void;
  /** Sets the master volume (0 to `VOLUME_MAX`) and the mute switch. */
  setVolume(level: number, muted: boolean): void;
}
