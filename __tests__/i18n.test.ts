import {t} from '../src/utils/i18n';

describe('i18n helper', () => {
  it('returns English text when language is English', () => {
    expect(t('en', 'Tiếng Việt', 'English')).toBe('English');
  });

  it('returns Vietnamese text when language is Vietnamese', () => {
    expect(t('vi', 'Tiếng Việt', 'English')).toBe('Tiếng Việt');
  });
});
