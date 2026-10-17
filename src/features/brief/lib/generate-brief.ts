import type { CryptoAsset } from '@/features/crypto/types'
import type { Earthquake } from '@/features/earthquakes/types'
import type { GithubRepo } from '@/features/github/types'
import type { HackerNewsStory } from '@/features/hacker-news/types'
import type { NewsHeadline } from '@/features/news/types'
import type { KpReading, Launch } from '@/features/space/types'
import type { AirQuality, WeatherData } from '@/features/weather/types'
import { marketSummary, formatUsdCompact } from '@/features/crypto/lib/market-math'
import { formatStars, repoSummary } from '@/features/github/lib/github-terminal'
import { auroraLatitude, kpToScale } from '@/features/space/lib/geomagnetic'
import { conditionKey } from '@/features/weather/lib/conditions'
import { POLLUTANT_LABEL, worstPollutant } from '@/features/weather/lib/weather-terminal'
import { formatAge, formatPrice, formatSigned } from '@/lib/terminal-format'
import type { SourceRow } from '@/lib/source-registry'
import type { AlertSeverity } from '@/store/alerts-store'

export type InsightCategory = 'health' | 'crypto' | 'weather' | 'seismic' | 'air' | 'space' | 'tech' | 'news'

/** Keys under `terminal.overview.brief.rows`; the client translates them, so a language switch needs no refetch. */
export type BriefKey =
  | 'healthDegraded' | 'healthDegradedDetail' | 'healthError' | 'healthErrorDetail' | 'streamDown' | 'streamDownDetail'
  | 'quake' | 'quakeDetail' | 'quakeCalm' | 'quakeCalmDetail'
  | 'airOver' | 'airAqi' | 'airDetail'
  | 'heat' | 'cold' | 'rain' | 'weatherNow' | 'weatherDetail'
  | 'cryptoMover' | 'cryptoMoverDetail' | 'cryptoStable' | 'cryptoStableDetail'
  | 'geomagneticStorm' | 'geomagneticStormDetail' | 'launch' | 'launchDetail' | 'launchDetailKp'
  | 'techLead' | 'techDetail' | 'techDetailHn'
  | 'newsHeadline' | 'newsDetail'

export interface BriefText {
  key: BriefKey
  params: Record<string, string | number>
}

export interface BriefInsight {
  id: string
  category: InsightCategory
  severity: AlertSeverity
  /** When the fact was observed, for the time column */
  at: number
  /** Screen the row opens */
  screen: number
  /** Source column for health rows; other rows show their category */
  sourceName?: string
  headline: BriefText
  detail: BriefText
}

interface Stamped<Data> {
  data: Data
  /** dataUpdatedAt of the query */
  at: number
}

export interface BriefInput {
  now: number
  /** Failing sources from the registry */
  sources?: SourceRow[]
  crypto?: Stamped<CryptoAsset[]>
  weather?: Stamped<WeatherData>
  air?: Stamped<AirQuality>
  /** City the weather and air rows talk about */
  city?: string
  quakes?: Stamped<Earthquake[]>
  launches?: Stamped<Launch[]>
  kp?: Stamped<KpReading[]>
  repos?: Stamped<GithubRepo[]>
  hackerNews?: Stamped<HackerNewsStory[]>
  headlines?: Stamped<NewsHeadline[]>
  /** Formats a headline's yyyy-mm-dd day in the UI language */
  formatDay?: (isoDay: string) => string
}

const SEVERITY_ORDER: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 }
const SIGNIFICANT_QUAKE = 5
const CRITICAL_QUAKE = 6.5
const MOVER_PERCENT = 8
const CRITICAL_MOVER_PERCENT = 15
const STORM_KP = 5
const RAIN_PERCENT = 70
const HEAT_CELSIUS = 35
const COLD_CELSIUS = 5
const UNHEALTHY_AQI = 150
const HAZARDOUS_AQI = 300

const text = (key: BriefKey, params: BriefText['params'] = {}): BriefText => ({ key, params })

function healthInsights(rows: SourceRow[], now: number): BriefInsight[] {
  return rows.flatMap((row): BriefInsight[] => {
    const base = { category: 'health' as const, at: row.failingSince ?? now, screen: row.entry.screen, sourceName: row.entry.short, id: `health-${row.entry.label}` }
    const source = row.entry.label
    if (row.status === 'reconnecting') {
      return [{ ...base, severity: 'warning', headline: text('streamDown', { source }), detail: text('streamDownDetail', { age: formatAge(row.ageMs ?? 0, true) }) }]
    }
    if (row.status !== 'degraded' && row.status !== 'error') return []
    const failure = row.failure ?? { code: 'network', status: null }
    const params = { source, cause: failure.code, code: failure.status === null ? '' : ` (${failure.status})` }
    return row.status === 'degraded'
      ? [{ ...base, severity: 'warning', headline: text('healthDegraded', params), detail: text('healthDegradedDetail', { age: formatAge(row.ageMs ?? 0, true) }) }]
      : [{ ...base, severity: 'critical', headline: text('healthError', params), detail: text('healthErrorDetail') }]
  })
}

function quakeInsight({ data: quakes }: Stamped<Earthquake[]>): BriefInsight | null {
  if (!quakes.length) return null
  const strongest = quakes.reduce((top, quake) => (quake.magnitude > top.magnitude ? quake : top))
  const base = { id: 'seismic', category: 'seismic' as const, at: strongest.time, screen: 3 }
  const significant = quakes.filter((quake) => quake.magnitude >= SIGNIFICANT_QUAKE).length
  if (!significant) {
    return {
      ...base,
      severity: 'info',
      headline: text('quakeCalm', { count: quakes.length }),
      detail: text('quakeCalmDetail', { magnitude: strongest.magnitude.toFixed(1), place: strongest.place }),
    }
  }
  return {
    ...base,
    severity: strongest.magnitude >= CRITICAL_QUAKE ? 'critical' : 'warning',
    headline: text('quake', { magnitude: strongest.magnitude.toFixed(1), place: strongest.place }),
    detail: text('quakeDetail', { depth: Math.round(strongest.depth), count: significant }),
  }
}

function airInsight({ data: air, at }: Stamped<AirQuality>, city: string): BriefInsight | null {
  const worst = worstPollutant(air)
  const base = { id: 'air', category: 'air' as const, at, screen: 3, detail: text('airDetail', { aqi: air.aqi, band: air.category }) }
  const severity: AlertSeverity = air.aqi > HAZARDOUS_AQI ? 'critical' : 'warning'
  if (worst.ratio > 1) {
    return { ...base, severity, headline: text('airOver', { pollutant: POLLUTANT_LABEL[worst.pollutant], value: air[worst.pollutant], city, ratio: worst.ratio }) }
  }
  if (air.aqi > UNHEALTHY_AQI) return { ...base, severity, headline: text('airAqi', { band: air.category, city, aqi: air.aqi }) }
  return null
}

function weatherInsight({ data: weather, at }: Stamped<WeatherData>, city: string): BriefInsight {
  const { temp, weatherCode } = weather.current
  const today = weather.forecast[0]
  const rain = today?.precipitationProb ?? 0
  const params = { temp: Math.round(temp), condition: conditionKey(weatherCode), city, percent: rain }
  const key: BriefKey = temp >= HEAT_CELSIUS ? 'heat' : temp <= COLD_CELSIUS ? 'cold' : rain >= RAIN_PERCENT ? 'rain' : 'weatherNow'
  return {
    id: 'weather',
    category: 'weather',
    severity: key === 'heat' || key === 'cold' ? 'warning' : 'info',
    at,
    screen: 3,
    headline: text(key, params),
    detail: text('weatherDetail', { max: Math.round(today?.tempMax ?? temp), min: Math.round(today?.tempMin ?? temp), uv: Math.round(today?.uvIndexMax ?? 0) }),
  }
}

function cryptoInsight({ data: coins, at }: Stamped<CryptoAsset[]>): BriefInsight | null {
  if (!coins.length) return null
  const summary = marketSummary(coins)
  const falling = coins.filter((coin) => coin.change24h < 0).length
  const mover = [...coins].sort((left, right) => Math.abs(right.change24h) - Math.abs(left.change24h))[0]
  const base = { id: 'crypto', category: 'crypto' as const, at, screen: 2 }
  if (Math.abs(mover.change24h) >= MOVER_PERCENT) {
    return {
      ...base,
      severity: Math.abs(mover.change24h) >= CRITICAL_MOVER_PERCENT ? 'critical' : 'warning',
      headline: text('cryptoMover', { symbol: mover.symbol.toUpperCase(), change: formatSigned(mover.change24h) }),
      detail: text('cryptoMoverDetail', { price: formatPrice(mover.price), falling, total: coins.length }),
    }
  }
  const leader = Math.abs(summary.topLoser.change24h) > Math.abs(summary.topGainer.change24h) ? summary.topLoser : summary.topGainer
  const bitcoin = coins.find((coin) => coin.id === 'bitcoin') ?? coins[0]
  return {
    ...base,
    severity: 'info',
    headline: text('cryptoStable', { symbol: bitcoin.symbol.toUpperCase(), price: formatPrice(bitcoin.price), change: formatSigned(bitcoin.change24h) }),
    detail: text('cryptoStableDetail', { falling, total: coins.length, leader: leader.symbol.toUpperCase(), leaderChange: formatSigned(leader.change24h), volume: formatUsdCompact(summary.volume24h) }),
  }
}

/** "2d 12h" / "5h 08m" until a launch. */
function launchIn(remainingMs: number): string {
  const minutes = Math.max(0, Math.floor(remainingMs / 60_000))
  const days = Math.floor(minutes / 1_440)
  const hours = Math.floor((minutes % 1_440) / 60)
  return days > 0 ? `${days}d ${String(hours).padStart(2, '0')}h` : `${hours}h ${String(minutes % 60).padStart(2, '0')}m`
}

function spaceInsight(input: BriefInput): BriefInsight | null {
  const latestKp = input.kp?.data.at(-1)
  const base = { id: 'space', category: 'space' as const, screen: 4 }
  if (latestKp && latestKp.kp >= STORM_KP) {
    return {
      ...base,
      severity: latestKp.kp >= 7 ? 'critical' : 'warning',
      at: Date.parse(latestKp.time),
      headline: text('geomagneticStorm', { kp: latestKp.kp.toFixed(2), scale: kpToScale(latestKp.kp) }),
      detail: text('geomagneticStormDetail', { latitude: auroraLatitude(latestKp.kp) }),
    }
  }
  const next = input.launches?.data.find((launch) => Date.parse(launch.net) > input.now)
  if (!next || !input.launches) return null
  const where = [next.rocket, next.pad].filter(Boolean).join(' · ').toLowerCase()
  return {
    ...base,
    severity: 'info',
    at: input.launches.at,
    headline: text('launch', { name: next.mission.toLowerCase(), countdown: launchIn(Date.parse(next.net) - input.now) }),
    detail: latestKp
      ? text('launchDetailKp', { where, kp: latestKp.kp.toFixed(2), scale: kpToScale(latestKp.kp) })
      : text('launchDetail', { where }),
  }
}

function techInsight({ data: repos, at }: Stamped<GithubRepo[]>, stories: HackerNewsStory[]): BriefInsight | null {
  const summary = repoSummary(repos)
  if (!summary.topLanguage) return null
  const top = repos.reduce((best, repo) => (repo.stars > best.stars ? repo : best))
  const story = stories[0]
  return {
    id: 'tech',
    category: 'tech',
    severity: 'info',
    at,
    screen: 6,
    headline: text('techLead', { language: summary.topLanguage.toLowerCase(), count: summary.topLanguageCount, total: summary.count }),
    detail: story
      ? text('techDetailHn', { repo: top.name, stars: formatStars(top.stars), story: story.title, points: story.points })
      : text('techDetail', { repo: top.name, stars: formatStars(top.stars) }),
  }
}

function newsInsight({ data: headlines, at }: Stamped<NewsHeadline[]>, formatDay: (isoDay: string) => string): BriefInsight | null {
  const first = headlines[0]
  if (!first) return null
  return {
    id: 'news',
    category: 'news',
    severity: 'info',
    at,
    screen: 5,
    headline: text('newsHeadline', { text: first.text }),
    detail: text('newsDetail', { article: first.article?.title ?? '', date: first.date ? formatDay(first.date) : '' }),
  }
}

/** Rule-based rows of [1.1], most severe first, then newest. */
export function generateDailyBrief(input: BriefInput): BriefInsight[] {
  const city = input.city ?? ''
  const insights: (BriefInsight | null)[] = [
    ...healthInsights(input.sources ?? [], input.now),
    input.quakes ? quakeInsight(input.quakes) : null,
    input.air ? airInsight(input.air, city) : null,
    input.weather ? weatherInsight(input.weather, city) : null,
    input.crypto ? cryptoInsight(input.crypto) : null,
    spaceInsight(input),
    input.repos ? techInsight(input.repos, input.hackerNews?.data ?? []) : null,
    input.headlines ? newsInsight(input.headlines, input.formatDay ?? ((day) => day)) : null,
  ]
  return insights
    .filter((insight): insight is BriefInsight => insight !== null)
    .sort((left, right) => SEVERITY_ORDER[left.severity] - SEVERITY_ORDER[right.severity] || right.at - left.at)
}
