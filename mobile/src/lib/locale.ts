import { getLocales } from 'expo-localization';

export type Lang = 'en' | 'zh';

export function deviceLang(): Lang {
  try {
    return getLocales()[0]?.languageCode === 'zh' ? 'zh' : 'en';
  } catch {
    return 'en';
  }
}
