import { useTranslation } from 'react-i18next'
import { GRID_12, OVERVIEW_SPAN } from '@/components/terminal/grid'
import { generateDailyBrief, type BriefInsight } from '@/features/brief/lib/generate-brief'
import { useCryptoMarket } from '@/features/crypto/api/coingecko'
import { useEarthquakes } from '@/features/earthquakes/api/usgs'
import { useTrendingRepos } from '@/features/github/api/github'
import { useHackerNewsFrontPage } from '@/features/hacker-news/api/hacker-news'
import { useFeaturedFeed } from '@/features/news/api/wikimedia-feed'
import { BriefPanel } from '@/features/overview/components/brief-panel'
import { MarketsCard, NewsCard, PlanetCard, SpaceCard, TechCard } from '@/features/overview/components/overview-cards'
import { SourcesPanel } from '@/features/overview/components/sources-panel'
import { useUpcomingLaunches } from '@/features/space/api/launches'
import { useKpIndex } from '@/features/space/api/space-weather'
import { useAirQuality } from '@/features/weather/api/air-quality'
import { useWeather } from '@/features/weather/api/open-meteo'
import { useCityName } from '@/features/weather/lib/use-city-name'
import { useSourceRows } from '@/hooks/use-source-rows'
import { intlLocale } from '@/i18n'
import { countRowStatuses, type SourceRow } from '@/lib/source-registry'
import { formatShortDate, parseIsoDay } from '@/lib/terminal-format'
import { useAppStore } from '@/store/app-store'
import { useGeoStore } from '@/store/geo-store'

/** Data or nothing, stamped with when the query last succeeded. */
function stamped<Data>(query: { data: Data | undefined | null; dataUpdatedAt: number }) {
  return query.data ? { data: query.data, at: query.dataUpdatedAt } : undefined
}

function useBrief(rows: SourceRow[], now: number): BriefInsight[] {
  const coords = useGeoStore((state) => state.coords)
  const cryptoIds = useAppStore((state) => state.cryptoIds)
  const city = useCityName().split(',')[0].toLowerCase()
  const locale = intlLocale()
  const crypto = useCryptoMarket(cryptoIds)
  const weather = useWeather(coords ?? undefined)
  const air = useAirQuality(coords ?? undefined)
  const quakes = useEarthquakes(2.5)
  const launches = useUpcomingLaunches()
  const kp = useKpIndex()
  const repos = useTrendingRepos()
  const hackerNews = useHackerNewsFrontPage()
  const feed = useFeaturedFeed()

  return generateDailyBrief({
    now,
    sources: rows,
    city,
    crypto: stamped(crypto),
    weather: stamped(weather),
    air: stamped(air),
    quakes: stamped(quakes),
    launches: stamped(launches),
    kp: stamped(kp),
    repos: stamped(repos),
    hackerNews: stamped(hackerNews),
    headlines: feed.data ? { data: feed.data.headlines, at: feed.dataUpdatedAt } : undefined,
    formatDay: (isoDay) => formatShortDate(parseIsoDay(isoDay), locale),
  })
}

type DayPart = 'morning' | 'afternoon' | 'evening'
const dayPart = (hour: number): DayPart => (hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening')

/** pt "sexta, 16 out" · en "Friday, Oct 16". */
function formatToday(date: Date, locale: string): string {
  const weekday = date.toLocaleDateString(locale, { weekday: 'long' }).replace('-feira', '')
  return `${weekday}, ${formatShortDate(date, locale)}`
}

function OverviewHeader({ insights, rows, now }: { insights: BriefInsight[]; rows: SourceRow[]; now: number }) {
  const { t } = useTranslation()
  const date = new Date(now)
  const sources = countRowStatuses(rows)
  const parts = (['critical', 'warning', 'info'] as const)
    .map((severity) => [severity, insights.filter((insight) => insight.severity === severity).length] as const)
    .filter(([, count]) => count > 0)
    .map(([severity, count]) => t(`terminal.overview.summary.${severity}`, { count }))
  parts.push(t('terminal.overview.summary.sourcesOk', { count: sources.ok }))
  if (sources.degraded) parts.push(t('terminal.status.degraded', { count: sources.degraded }))
  if (sources.error) parts.push(t('terminal.status.failed', { count: sources.error }))

  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-[24px] gap-y-[6px]">
      <h1 className="m-0 text-greet font-semibold text-text">
        {t(`terminal.overview.greeting.${dayPart(date.getHours())}`)} · {formatToday(date, intlLocale())}
      </h1>
      <span className="text-dim">{parts.join(' · ')}</span>
    </div>
  )
}

export function Dashboard() {
  const { rows, now } = useSourceRows()
  const insights = useBrief(rows, now)
  return (
    <>
      <OverviewHeader insights={insights} rows={rows} now={now} />
      <div className={GRID_12}>
        <BriefPanel insights={insights} className={OVERVIEW_SPAN.brief} />
        <SourcesPanel rows={rows} className={OVERVIEW_SPAN.sources} />
        <MarketsCard className={OVERVIEW_SPAN.markets} />
        <PlanetCard className={OVERVIEW_SPAN.planet} />
        <SpaceCard className={OVERVIEW_SPAN.space} />
        <NewsCard className={OVERVIEW_SPAN.news} />
        <TechCard className={OVERVIEW_SPAN.tech} />
      </div>
    </>
  )
}
