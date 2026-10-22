import { describe, expect, it } from 'vitest';
import { LANGUAGES, messages } from '../../src/domain/i18n/messages';

describe('messages', () => {
  it.each(LANGUAGES)('%s uses only characters the bitmap font draws', (language) => {
    for (const value of Object.values(messages(language))) expect(value).toMatch(/^[0-9A-Z -]+$/);
  });

  it('has the same keys in every language and differs where it should', () => {
    expect(Object.keys(messages('fr'))).toEqual(Object.keys(messages('en')));
    expect(messages('fr').start).not.toBe(messages('en').start);
  });
});
