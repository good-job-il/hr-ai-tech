import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import heTranslation from './locales/he/translation.json';
import enTranslation from './locales/en/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      he: { translation: heTranslation },
      en: { translation: enTranslation },
    },
    fallbackLng: 'en',
    supportedLngs: ['he', 'en'],
    detection: {
      order: ['localStorage'],
      caches: ['localStorage'],
      lookupLocalStorage: 'hhLang',
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
