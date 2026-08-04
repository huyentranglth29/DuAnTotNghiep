export type AppLanguage = 'vi' | 'en';

export function t(language: AppLanguage | undefined, viText: string, enText: string) {
  return language === 'en' ? enText : viText;
}
