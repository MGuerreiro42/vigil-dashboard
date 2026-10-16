import type { pt } from './locales/pt'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: { translation: typeof pt }
  }
}
