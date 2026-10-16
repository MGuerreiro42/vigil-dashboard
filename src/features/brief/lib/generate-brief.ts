import type { CryptoAsset } from '@/features/crypto/types'
import type { WeatherCurrent, ForecastDay } from '@/features/weather/types'
import type { AirQuality } from '@/features/weather/types'
import type { Earthquake } from '@/features/earthquakes/types'
import type { GithubRepo } from '@/features/github/types'
import type { TFunction } from 'i18next'
import i18n, { intlLocale } from '@/i18n'

export type InsightCategory = 'crypto' | 'weather' | 'seismic' | 'air' | 'tech'
export type InsightSeverity = 'info' | 'warning' | 'alert'

export interface BriefInsight {
  id: string
  category: InsightCategory
  severity: InsightSeverity
  headline: string
  detail: string
  dataSource: string[]
}

export interface BriefInput {
  crypto?: CryptoAsset[]
  weather?: WeatherCurrent
  forecast?: ForecastDay[]
  airQuality?: AirQuality | null
  earthquakes?: Earthquake[]
  githubTrending?: GithubRepo[]
}

const usd = (value: number, maximumFractionDigits: number) =>
  `$${value.toLocaleString('en-US', { maximumFractionDigits })}`

/** Rule-based insights, written with the given translate function (defaults to the active language). */
export function generateDailyBrief(input: BriefInput, t: TFunction = i18n.t): BriefInsight[] {
  const insights: BriefInsight[] = []

  // --- CRYPTO ---
  if (input.crypto && input.crypto.length > 0) {
    const bigMovers = input.crypto.filter((coin) => Math.abs(coin.change24h) >= 8)
    if (bigMovers.length > 0) {
      const top = bigMovers.sort((first, second) => Math.abs(second.change24h) - Math.abs(first.change24h))[0]
      insights.push({
        id: 'crypto-top-mover',
        category: 'crypto',
        severity: Math.abs(top.change24h) >= 15 ? 'alert' : 'warning',
        headline: t(top.change24h > 0 ? 'brief.cryptoTopMover.up' : 'brief.cryptoTopMover.down', { symbol: top.symbol, percent: Math.abs(top.change24h).toFixed(1) }),
        detail: [
          t('brief.cryptoTopMover.detail', { name: top.name, price: usd(top.price, 2) }),
          bigMovers.length > 1 ? t('brief.cryptoTopMover.others', { count: bigMovers.length - 1 }) : '',
        ].join(' ').trim(),
        dataSource: ['CoinGecko'],
      })
    } else {
      const btc = input.crypto.find((coin) => coin.id === 'bitcoin')
      if (btc) {
        insights.push({
          id: 'crypto-stable',
          category: 'crypto',
          severity: 'info',
          headline: t('brief.cryptoStable.headline', { price: usd(btc.price, 0) }),
          detail: t('brief.cryptoStable.detail', { percent: btc.change24h.toFixed(2) }),
          dataSource: ['CoinGecko'],
        })
      }
    }
  }

  // --- CLIMA ---
  if (input.weather) {
    const { temp, humidity } = input.weather
    if (temp >= 35) {
      insights.push({
        id: 'weather-heat',
        category: 'weather',
        severity: input.airQuality && input.airQuality.aqi > 100 ? 'alert' : 'warning',
        headline: t('brief.heat.headline', { temperature: temp.toFixed(0) }),
        detail:
          input.airQuality && input.airQuality.aqi > 100
            ? t('brief.heat.critical', { aqi: input.airQuality.aqi })
            : t('brief.heat.detail', { humidity }),
        dataSource: ['Open-Meteo'],
      })
    } else if (temp <= 5) {
      insights.push({
        id: 'weather-cold',
        category: 'weather',
        severity: 'warning',
        headline: t('brief.cold.headline', { temperature: temp.toFixed(0) }),
        detail: t('brief.cold.detail', { temperature: input.weather.feelsLike.toFixed(0) }),
        dataSource: ['Open-Meteo'],
      })
    }

    if (input.forecast) {
      const rainToday = input.forecast[0]?.precipitationProb ?? 0
      if (rainToday >= 70) {
        insights.push({
          id: 'weather-rain',
          category: 'weather',
          severity: 'info',
          headline: t('brief.rain.headline', { percent: rainToday }),
          detail: t('brief.rain.detail'),
          dataSource: ['Open-Meteo'],
        })
      }
    }
  }

  // --- QUALIDADE DO AR ---
  if (input.airQuality && input.airQuality.aqi > 0) {
    const { aqi, category } = input.airQuality
    if (category === 'unhealthy' || category === 'very-unhealthy' || category === 'hazardous') {
      insights.push({
        id: 'air-quality',
        category: 'air',
        severity: category === 'hazardous' ? 'alert' : 'warning',
        headline: t(category === 'hazardous' ? 'brief.air.hazardous' : 'brief.air.unhealthy', { aqi }),
        detail: t('brief.air.detail', { pm25: input.airQuality.pm25.toFixed(1) }),
        dataSource: ['Open-Meteo'],
      })
    }
  }

  // --- TERREMOTOS ---
  if (input.earthquakes && input.earthquakes.length > 0) {
    const significant = input.earthquakes.filter((quake) => quake.magnitude >= 5.0)
    if (significant.length > 0) {
      const top = significant[0]
      insights.push({
        id: 'seismic-strongest',
        category: 'seismic',
        severity: top.magnitude >= 6.5 ? 'alert' : 'warning',
        headline: t('brief.quake.headline', { magnitude: top.magnitude.toFixed(1), place: top.place }),
        detail: [
          significant.length > 1 ? t('brief.quake.count', { count: significant.length }) : '',
          t('brief.quake.depth', { depth: top.depth.toFixed(0) }),
          top.tsunamiRisk ? t('brief.quake.tsunami') : '',
        ].filter(Boolean).join(' '),
        dataSource: ['USGS'],
      })
    } else {
      const count = input.earthquakes.length
      insights.push({
        id: 'seismic-count',
        category: 'seismic',
        severity: 'info',
        headline: t('brief.quakeCount.headline', { count }),
        detail: t('brief.quakeCount.detail', { magnitude: Math.max(...input.earthquakes.map((quake) => quake.magnitude)).toFixed(1) }),
        dataSource: ['USGS'],
      })
    }
  }

  // --- GITHUB TRENDING ---
  if (input.githubTrending && input.githubTrending.length > 0) {
    const languages = input.githubTrending.map((repo) => repo.language).filter(Boolean) as string[]
    const langCount: Record<string, number> = {}
    languages.forEach((language) => { langCount[language] = (langCount[language] ?? 0) + 1 })
    const topLang = Object.entries(langCount).sort((first, second) => second[1] - first[1])[0]

    if (topLang) {
      const topRepo = input.githubTrending[0]
      insights.push({
        id: 'github-trending',
        category: 'tech',
        severity: 'info',
        headline: t('brief.github.headline', { language: topLang[0], count: topLang[1] }),
        detail: t('brief.github.detail', { name: topRepo.name, stars: topRepo.stars.toLocaleString(intlLocale()), description: topRepo.description?.slice(0, 80) ?? '' }).trim(),
        dataSource: ['GitHub'],
      })
    }
  }

  return insights
}
