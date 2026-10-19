import type { Language } from '../ports/save-port';

/**
 * Every string the screens show. The bitmap font draws digits, `A`–`Z`, `-` and the space only,
 * so the texts are capitals without accents (a test enforces it).
 */
export interface MessageSet {
  readonly title: string;
  readonly start: string;
  readonly scores: string;
  readonly settings: string;
  readonly back: string;
  readonly language: string;
  /** Name of the language itself, shown on the language row. */
  readonly languageName: string;
  readonly volume: string;
  readonly sound: string;
  readonly on: string;
  readonly off: string;
  readonly hold: string;
  readonly score: string;
  readonly level: string;
  readonly lines: string;
  readonly next: string;
  readonly paused: string;
  readonly pressP: string;
  readonly gameOver: string;
  readonly pressEnter: string;
  readonly escMenu: string;
  readonly hallOfFame: string;
  readonly noScores: string;
  readonly newRecord: string;
  readonly enterName: string;
  readonly navigate: string;
}

const EN: MessageSet = {
  title: 'RETRO BLOCKS',
  start: 'START',
  scores: 'HALL OF FAME',
  settings: 'SETTINGS',
  back: 'BACK',
  language: 'LANGUAGE',
  languageName: 'ENGLISH',
  volume: 'VOLUME',
  sound: 'SOUND',
  on: 'ON',
  off: 'OFF',
  hold: 'HOLD',
  score: 'SCORE',
  level: 'LEVEL',
  lines: 'LINES',
  next: 'NEXT',
  paused: 'PAUSED',
  pressP: 'PRESS P',
  gameOver: 'GAME OVER',
  pressEnter: 'PRESS ENTER',
  escMenu: 'ESC MENU',
  hallOfFame: 'HALL OF FAME',
  noScores: 'NO SCORES YET',
  newRecord: 'NEW RECORD',
  enterName: 'ENTER YOUR NAME',
  navigate: 'ARROWS AND ENTER',
};

const FR: MessageSet = {
  title: 'RETRO BLOCKS',
  start: 'JOUER',
  scores: 'SCORES',
  settings: 'OPTIONS',
  back: 'RETOUR',
  language: 'LANGUE',
  languageName: 'FRANCAIS',
  volume: 'VOLUME',
  sound: 'SON',
  on: 'OUI',
  off: 'NON',
  hold: 'RESERVE',
  score: 'SCORE',
  level: 'NIVEAU',
  lines: 'LIGNES',
  next: 'SUIVANT',
  paused: 'PAUSE',
  pressP: 'APPUYEZ SUR P',
  gameOver: 'PERDU',
  pressEnter: 'APPUYEZ SUR ENTREE',
  escMenu: 'ECHAP MENU',
  hallOfFame: 'MEILLEURS SCORES',
  noScores: 'AUCUN SCORE',
  newRecord: 'NOUVEAU RECORD',
  enterName: 'VOTRE NOM',
  navigate: 'FLECHES ET ENTREE',
};

const ALL: Readonly<Record<Language, MessageSet>> = { en: EN, fr: FR };

/** The messages of `language`; the record type makes a missing language a compile error. */
export function messages(language: Language): MessageSet {
  return ALL[language];
}

/** Every language, in the order the settings screen cycles through them. */
export const LANGUAGES: readonly Language[] = ['en', 'fr'];
