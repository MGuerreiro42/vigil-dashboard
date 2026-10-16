import type { WikiLangCode } from '@/features/wikipedia/types'

export const queryKeys = {
  crypto: {
    market: (ids: string[]) => ['crypto', 'market', ids] as const,
    exchangeRates: () => ['crypto', 'exchange-rates'] as const,
  },
  weather: (lat: number, lng: number) => ['weather', lat, lng] as const,
  airQuality: (lat: number, lng: number) => ['air-quality', lat, lng] as const,
  earthquakes: (minMagnitude: number) => ['earthquakes', minMagnitude] as const,
  naturalEvents: () => ['natural-events'] as const,
  github: {
    trending: (language?: string) => ['github', 'trending', language] as const,
  },
  news: {
    featured: (lang: string, date: string) => ['news', 'featured', lang, date] as const,
  },
  wikipedia: {
    random: (lang: WikiLangCode, seed: number) => ['wikipedia', 'random', lang, seed] as const,
  },
  iss: {
    position: () => ['iss', 'position'] as const,
    coordinates: (timeWindow: number | null) => ['iss', 'coordinates', timeWindow] as const,
    futurePath: (timeWindow: number | null) => ['iss', 'future-path', timeWindow] as const,
    tle: () => ['iss', 'tle'] as const,
  },
}
