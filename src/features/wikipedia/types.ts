export type WikiSummary = {
  pageid: number
  title: string
  description?: string
  extract: string
  thumbnail?: { source: string; width: number; height: number }
  originalimage?: { source: string; width: number; height: number }
  coordinates?: { lat: number; lon: number }
  content_urls: {
    desktop: { page: string }
    mobile: { page: string }
  }
  timestamp: string
  lang: string
}

export const WIKI_LANGUAGES = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'pt', label: 'PT', name: 'Português' },
  { code: 'es', label: 'ES', name: 'Español' },
  { code: 'fr', label: 'FR', name: 'Français' },
  { code: 'de', label: 'DE', name: 'Deutsch' },
  { code: 'ja', label: 'JA', name: '日本語' },
] as const

export type WikiLangCode = (typeof WIKI_LANGUAGES)[number]['code']
