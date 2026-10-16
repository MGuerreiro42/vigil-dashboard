import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import { en } from './locales/en'
import { pt } from './locales/pt'

export const LANGUAGES = [
  { code: 'pt', label: 'PT', locale: 'pt-BR' },
  { code: 'en', label: 'EN', locale: 'en-US' },
] as const

export type LanguageCode = (typeof LANGUAGES)[number]['code']

export const resources = {
  pt: { translation: pt },
  en: { translation: en },
} as const

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: LANGUAGES.map((language) => language.code),
    // pt-BR, pt-PT → pt; en-GB → en
    nonExplicitSupportedLngs: true,
    fallbackLng: 'en',
    interpolation: { escapeValue: false }, // React already escapes
    detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'] },
  })

/** BCP 47 locale for Intl formatting in the active language. */
export function intlLocale(): string {
  const active = LANGUAGES.find((language) => language.code === i18n.resolvedLanguage)
  return active?.locale ?? 'en-US'
}

function syncDocumentLanguage() {
  document.documentElement.lang = intlLocale()
}
syncDocumentLanguage()
i18n.on('languageChanged', syncDocumentLanguage)

export default i18n
