import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en/translation.json';
import ptBR from './locales/pt-BR/translation.json';
import es from './locales/es/translation.json';
import it from './locales/it/translation.json';
import fr from './locales/fr/translation.json';

const resources = {
  en: { translation: en },
  'pt-BR': { translation: ptBR },
  es: { translation: es },
  it: { translation: it },
  fr: { translation: fr },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'pt-BR', 'es', 'it', 'fr'],
    debug: false,
    ns: ['translation'],
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage'],
      caches: ['localStorage'],
      lookupLocalStorage: 'language',
    },
    react: {
      useSuspense: true,
    },
  });

export default i18n;
