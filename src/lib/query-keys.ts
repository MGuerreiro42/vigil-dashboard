import type { WikiLangCode } from '@/features/wikipedia/types'

export const queryKeys = {
  crypto: {
    market: (ids: string[]) => ['crypto', 'market', ids] as const,
  },
  economy: {
    fxLatest: () => ['economy', 'fx', 'latest'] as const,
    fxHistory: (currency: string, days: number) => ['economy', 'fx', currency, days] as const,
    bcb: (series: string) => ['economy', 'bcb', series] as const,
    fearGreed: () => ['economy', 'fear-greed'] as const,
    cryptoGlobal: () => ['economy', 'crypto-global'] as const,
    bitcoinFees: () => ['economy', 'bitcoin-fees'] as const,
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
  space: {
    launches: () => ['space', 'launches'] as const,
    kpIndex: () => ['space', 'kp-index'] as const,
    alerts: () => ['space', 'alerts'] as const,
    asteroids: (date: string) => ['space', 'asteroids', date] as const,
    news: () => ['space', 'news'] as const,
  },
  iss: {
    position: () => ['iss', 'position'] as const,
    coordinates: (timeWindow: number | null) => ['iss', 'coordinates', timeWindow] as const,
    futurePath: (timeWindow: number | null) => ['iss', 'future-path', timeWindow] as const,
    tle: () => ['iss', 'tle'] as const,
  },
}
