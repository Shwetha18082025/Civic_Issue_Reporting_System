import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from './locales/en.json'
import kn from './locales/kn.json'
import hi from './locales/hi.json'
import { startAutoTranslate } from './autoTranslate'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      kn: { translation: kn },
      hi: { translation: hi },
    },
    fallbackLng: 'en',             // any missing text falls back to English
    supportedLngs: ['en', 'kn', 'hi'],
    load: 'languageOnly',          // 'en-US' -> 'en'
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],    // remembers the user's choice after refresh
      lookupLocalStorage: 'civicreport_lang',
    },
  })

// Keep <html lang="..."> in sync (helps screen readers and font selection)
document.documentElement.lang = i18n.resolvedLanguage || 'en'
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng
})

// Translate every page automatically (see autoTranslate.js + dictionary.js)
startAutoTranslate(i18n)

export default i18n
