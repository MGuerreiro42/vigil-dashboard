import { useMemo, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { DotMap } from '@/components/geo/dot-map'
import type { GeoMarker, GeoTrackPoint } from '@/components/geo/dot-grid'
import { DataTable, Cell, TableRow } from '@/components/terminal/data-table'
import { PanelDivider } from '@/components/terminal/panel'
import { combineQueries } from '@/components/terminal/panel-state'
import { QueryPanel } from '@/components/terminal/query-panel'
import { Sparkline, ToneText } from '@/components/terminal/text'
import { useCryptoMarket } from '@/features/crypto/api/coingecko'
import { useLiveQuote } from '@/features/crypto/hooks/use-live-quote'
import { sortCoins } from '@/features/crypto/lib/market-math'
import type { CryptoAsset } from '@/features/crypto/types'
import { useEarthquakes } from '@/features/earthquakes/api/usgs'
import { quakeGlyph, quakeTone, sortQuakes } from '@/features/earthquakes/lib/quake-terminal'
import { useBcbSeries } from '@/features/economy/api/bcb'
import { useFearGreed } from '@/features/economy/api/crypto-pulse'
import { useFxHistory, useFxLatest } from '@/features/economy/api/frankfurter'
import { fearGreedBand, fearGreedTone, formatBrazil, percentChange, realRate } from '@/features/economy/lib/economy-format'
import { useTrendingRepos } from '@/features/github/api/github'
import { formatStars, sortRepos } from '@/features/github/lib/github-terminal'
import { useHackerNewsFrontPage } from '@/features/hacker-news/api/hacker-news'
import { useISSPosition, useISSTLE } from '@/features/iss/api/iss'
import { propagateTrack, utcOffsetLabel, type TrackSample } from '@/features/iss/lib/iss-track'
import { useRegionName } from '@/features/iss/lib/use-region-name'
import type { ISSPosition, ISSTLE } from '@/features/iss/types'
import { useNaturalEvents } from '@/features/natural-events/api/gdacs'
import { ALERT_COLOR, alertOf, eventGlyph } from '@/features/natural-events/lib/event-terminal'
import { useFeaturedFeed } from '@/features/news/api/wikimedia-feed'
import { useBlueskyTrends } from '@/features/pulse/api/bluesky-trends'
import { useWikiEditStream } from '@/features/pulse/hooks/use-wiki-edit-stream'
import { bucketedPerSecond } from '@/features/pulse/lib/wiki-edits'
import { useNearEarthObjects } from '@/features/space/api/asteroids'
import { useUpcomingLaunches } from '@/features/space/api/launches'
import { useKpIndex } from '@/features/space/api/space-weather'
import { formatCountdown } from '@/features/space/lib/countdown'
import { kpToScale } from '@/features/space/lib/geomagnetic'
import { kpTone } from '@/features/space/lib/space-terminal'
import { useAirQuality } from '@/features/weather/api/air-quality'
import { useWeather } from '@/features/weather/api/open-meteo'
import { conditionLabel } from '@/features/weather/lib/conditions'
import { useCityName } from '@/features/weather/lib/use-city-name'
import { aqiTone, POLLUTANT_LABEL, worstPollutant } from '@/features/weather/lib/weather-terminal'
import { useNow } from '@/hooks/use-now'
import { intlLocale } from '@/i18n'
import { classifyError } from '@/lib/http'
import { changeTone, formatAge, formatPrice, formatShortDate, formatSigned, parseIsoDay } from '@/lib/terminal-format'
import { useAppStore } from '@/store/app-store'
import { useGeoStore } from '@/store/geo-store'

const MAP_STYLE = { height: '180px' }
// Label first gives way, down to a readable width (long launch names truncate); then values wrap
const KEY_VALUES = 'minmax(10ch,1fr) auto'
const KV_GAP = '2px 12px'
const TOP_ROWS = 3
const MARKET_ROWS = 5
// 168 hourly points sampled down to an 11-character sparkline
const SPARK_STEP = 17
const ISS_PAST_MINUTES = -46
const ISS_FUTURE_MINUTES = 92
const KP_SPARK_LENGTH = 16
const MAP_MAGNITUDE = 4.5
const LABELLED_MAGNITUDE = 6

interface CardProps {
  className: string
}

/** Opens a screen from an overview card. */
function useOpen(path: string) {
  const navigate = useNavigate()
  return () => navigate(path)
}

function KeyValues({ divided = false, children }: { divided?: boolean; children: ReactNode }) {
  const table = <DataTable columns={KEY_VALUES} gap={KV_GAP}>{children}</DataTable>
  return divided ? <PanelDivider>{table}</PanelDivider> : table
}

function KeyValue({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <TableRow>
      <Cell truncate className="text-dim">{label}</Cell>
      <Cell right>{children}</Cell>
    </TableRow>
  )
}

const Missing = () => <ToneText tone="dim">—</ToneText>

// ─── [2] markets ─────────────────────────────────────────────────────────────

function CoinRow({ coin }: { coin: CryptoAsset }) {
  const { price, change } = useLiveQuote(coin)
  const tone = changeTone(change)
  const history = coin.sparkline
  const sampled = history.length ? [...history.filter((_, index) => index % SPARK_STEP === 0), history[history.length - 1]] : []
  return (
    <TableRow>
      <Cell>{coin.symbol.toUpperCase()}</Cell>
      <Cell right>{formatPrice(price)}</Cell>
      <Cell right><ToneText tone={tone}>{formatSigned(change)}</ToneText></Cell>
      {/* The Binance fallback has no 7-day history */}
      <Cell className="whitespace-nowrap">{sampled.length ? <Sparkline values={sampled} tone={tone} /> : <Missing />}</Cell>
    </TableRow>
  )
}

function MarketsMacro() {
  const { t } = useTranslation()
  const { data: fx } = useFxLatest()
  const { data: fxHistory } = useFxHistory('BRL', 90)
  const { data: selic } = useBcbSeries('selic')
  const { data: ipca } = useBcbSeries('ipca12m')
  const { data: fearGreed } = useFearGreed()
  const brl = fx?.rates.BRL
  const fxChange = fxHistory && fxHistory.length > 1 ? percentChange(fxHistory[fxHistory.length - 2].value, fxHistory[fxHistory.length - 1].value) : null
  const selicNow = selic?.at(-1)?.value
  const ipcaNow = ipca?.at(-1)?.value
  const real = selicNow !== undefined && ipcaNow !== undefined ? realRate(selicNow, ipcaNow) : null

  return (
    <KeyValues divided>
      <KeyValue label="USD/BRL">
        {brl === undefined ? <Missing /> : formatBrazil(brl, 4)}
        {fxChange !== null && <> <ToneText tone={changeTone(fxChange)}>{formatSigned(fxChange)}%</ToneText></>}
      </KeyValue>
      <KeyValue label={t('terminal.overview.markets.rates')}>
        {selicNow === undefined ? <Missing /> : `${formatBrazil(selicNow, 2)}%`}
        {real !== null && <> · <ToneText tone={changeTone(real)}>{formatBrazil(real, 2)}%</ToneText></>}
      </KeyValue>
      <KeyValue label={t('terminal.overview.markets.fearGreed')}>
        {fearGreed
          ? <ToneText tone={fearGreedTone(fearGreed.value)}>{fearGreed.value} {t(`terminal.markets.pulse.bands.${fearGreedBand(fearGreed.value)}`)}</ToneText>
          : <Missing />}
      </KeyValue>
    </KeyValues>
  )
}

export function MarketsCard({ className }: CardProps) {
  const { t } = useTranslation()
  const cryptoIds = useAppStore((state) => state.cryptoIds)
  const market = useCryptoMarket(cryptoIds)
  return (
    <QueryPanel id="2" title={t('terminal.overview.markets.title')} query={market} source="coingecko" gap={8} onOpen={useOpen('/markets')} className={className}>
      {(coins) => (
        <>
          <DataTable
            columns="44px minmax(0,1fr) 60px 84px"
            header={[
              { label: t('terminal.overview.markets.columns.asset') },
              { label: t('terminal.overview.markets.columns.price'), right: true },
              { label: t('terminal.overview.markets.columns.change'), right: true },
              { label: t('terminal.overview.markets.columns.week') },
            ]}
          >
            {sortCoins(coins, 'rank').slice(0, MARKET_ROWS).map((coin) => <CoinRow key={coin.id} coin={coin} />)}
          </DataTable>
          <MarketsMacro />
        </>
      )}
    </QueryPanel>
  )
}

// ─── [3] planet ──────────────────────────────────────────────────────────────

function PlanetConditions({ city }: { city: string }) {
  const { t } = useTranslation()
  const coords = useGeoStore((state) => state.coords)
  const { data: weather } = useWeather(coords ?? undefined)
  const { data: air } = useAirQuality(coords ?? undefined)
  const worst = air ? worstPollutant(air) : null
  const rain = weather?.forecast[0]?.precipitationProb

  return (
    <>
      <KeyValue label={city}>
        {weather ? `${Math.round(weather.current.temp)}° ${conditionLabel(weather.current.weatherCode)}` : <Missing />}
        {rain !== undefined && <> · <ToneText tone="info">{t('terminal.overview.planet.rain', { percent: rain })}</ToneText></>}
      </KeyValue>
      <KeyValue label={t('terminal.overview.planet.air')}>
        {air && worst
          ? <><ToneText tone={aqiTone(air.category)}>{air.aqi}</ToneText> · {POLLUTANT_LABEL[worst.pollutant]} <ToneText tone={worst.ratio > 1 ? 'err' : 'ok'}>{worst.ratio.toLocaleString(intlLocale(), { maximumFractionDigits: 1 })}×</ToneText></>
          : <Missing />}
      </KeyValue>
    </>
  )
}

export function PlanetCard({ className }: CardProps) {
  const { t } = useTranslation()
  const now = useNow(60_000)
  const quakes = useEarthquakes(2.5)
  const events = useNaturalEvents()
  // "são paulo": the city without its region, lowercase like every label
  const city = useCityName().split(',')[0].toLowerCase()
  const query = combineQueries(quakes, events)

  const markers = useMemo<GeoMarker[]>(() => {
    if (!quakes.data || !events.data) return []
    const eventMarkers = events.data
      .filter((event) => event.categoryId !== 'wildfires')
      .map((event) => ({ lon: event.lng, lat: event.lat, glyph: eventGlyph(event), color: ALERT_COLOR[alertOf(event)] }))
    // Smallest first so the strongest quakes are drawn on top
    const quakeMarkers = sortQuakes(quakes.data.filter((quake) => quake.magnitude >= MAP_MAGNITUDE), 'magnitudeUp').map((quake) => ({
      lon: quake.location.lng,
      lat: quake.location.lat,
      glyph: quakeGlyph(quake.magnitude),
      color: `--color-${quakeTone(quake.magnitude)}`,
      label: quake.magnitude >= LABELLED_MAGNITUDE ? quake.magnitude.toFixed(1) : null,
    }))
    return [...eventMarkers, ...quakeMarkers]
  }, [quakes.data, events.data])

  return (
    <QueryPanel id="3" title={t('terminal.overview.planet.title')} query={query} source="usgs · gdacs" gap={8} onOpen={useOpen('/planet')} className={className}>
      {([quakeList, eventList]) => {
        const highAlert = eventList.filter((event) => event.alertLevel === 'Orange' || event.alertLevel === 'Red').length
        return (
          <>
            <DotMap label={t('terminal.overview.planet.mapLabel')} markers={markers} graticule={false} style={MAP_STYLE} />
            <DataTable columns="36px minmax(0,1fr) 36px">
              {sortQuakes(quakeList, 'magnitudeDown').slice(0, TOP_ROWS).map((quake) => (
                <TableRow key={quake.id}>
                  <Cell><ToneText tone={quakeTone(quake.magnitude)}>{quake.magnitude.toFixed(1)}</ToneText></Cell>
                  <Cell truncate>{quake.place}</Cell>
                  <Cell right className="text-dim">{formatAge(now - quake.time)}</Cell>
                </TableRow>
              ))}
            </DataTable>
            <KeyValues divided>
              <PlanetConditions city={city} />
              <KeyValue label={t('terminal.overview.planet.events')}>
                {eventList.length}
                {highAlert > 0 && <> · <ToneText tone="warn">{t('terminal.overview.planet.highAlert', { count: highAlert })}</ToneText></>}
              </KeyValue>
            </KeyValues>
          </>
        )
      }}
    </QueryPanel>
  )
}

// ─── [4] space ───────────────────────────────────────────────────────────────

const trackColor = (sample: TrackSample) => (sample.minutes < 0 ? '--color-rim' : sample.eclipsed ? '--color-info' : '--color-warn')

function IssSummary({ position, tle }: { position: ISSPosition; tle: ISSTLE }) {
  const { t } = useTranslation()
  const region = useRegionName(position)
  const at = position.timestamp * 1000
  const track = useMemo<GeoTrackPoint[]>(
    () => propagateTrack(tle.line1, tle.line2, at, ISS_PAST_MINUTES, ISS_FUTURE_MINUTES, 1).map((sample) => ({ lon: sample.lon, lat: sample.lat, color: trackColor(sample) })),
    [tle.line1, tle.line2, at],
  )
  const markers = useMemo<GeoMarker[]>(() => [{ lon: position.lng, lat: position.lat, glyph: '+', color: '--color-info', label: 'iss' }], [position.lng, position.lat])
  const eclipsed = position.visibility === 'eclipsed'

  return (
    <>
      <DotMap label={t('terminal.overview.space.mapLabel')} markers={markers} track={track} graticule={false} style={MAP_STYLE} />
      <KeyValues>
        <KeyValue label={t('terminal.overview.space.over')}>{region} · {utcOffsetLabel(position.lng)}</KeyValue>
        <KeyValue label={t('terminal.overview.space.light')}>
          <ToneText tone={eclipsed ? 'info' : 'warn'}>{t(eclipsed ? 'terminal.overview.space.night' : 'terminal.overview.space.day')}</ToneText>
        </KeyValue>
      </KeyValues>
    </>
  )
}

function SpaceFacts() {
  const { t } = useTranslation()
  const now = useNow(1_000)
  const { data: launches } = useUpcomingLaunches()
  const { data: kp } = useKpIndex()
  const asteroids = useNearEarthObjects()
  const next = launches?.find((launch) => Date.parse(launch.net) > now)
  const countdown = next ? formatCountdown(Date.parse(next.net), now) : null
  const latestKp = kp?.at(-1)

  let asteroidValue: ReactNode = <Missing />
  if (asteroids.isError) {
    const prefix = asteroids.data ? `cache ${formatAge(now - asteroids.dataUpdatedAt, true)}` : t('terminal.panel.error')
    const failure = classifyError(asteroids.error)
    // The card is too narrow for the full reason: the status, or the short code [1.2] uses
    const reason = failure.status ?? t(`terminal.overview.sources.latency.${failure.code}`)
    asteroidValue = <ToneText tone="err">{prefix} · {reason}</ToneText>
  } else if (asteroids.data) {
    asteroidValue = t('terminal.overview.space.asteroidsValue', { count: asteroids.data.length, hazardous: asteroids.data.filter((neo) => neo.hazardous).length })
  }

  return (
    <KeyValues divided>
      <KeyValue label={next ? next.mission.toLowerCase() : t('terminal.overview.space.noLaunch')}>
        {countdown ? <ToneText tone="info">T− {countdown}</ToneText> : <Missing />}
      </KeyValue>
      <KeyValue label="kp">
        {kp && latestKp
          ? <><ToneText tone={kpTone(latestKp.kp)}>{latestKp.kp.toFixed(2)} {kpToScale(latestKp.kp)}</ToneText> <Sparkline values={kp.slice(-KP_SPARK_LENGTH).map((reading) => reading.kp)} tone="dim" /></>
          : <Missing />}
      </KeyValue>
      <KeyValue label={t('terminal.overview.space.asteroids')}>{asteroidValue}</KeyValue>
    </KeyValues>
  )
}

export function SpaceCard({ className }: CardProps) {
  const { t } = useTranslation()
  const query = combineQueries(useISSPosition(), useISSTLE())
  return (
    <QueryPanel id="4" title={t('terminal.overview.space.title')} query={query} source="wheretheiss.at" gap={8} onOpen={useOpen('/space')} className={className}>
      {([position, tle]) => (
        <>
          <IssSummary position={position} tle={tle} />
          <SpaceFacts />
        </>
      )}
    </QueryPanel>
  )
}

// ─── [5] news ────────────────────────────────────────────────────────────────

function NewsPulse({ wiki }: { wiki: string }) {
  const { t } = useTranslation()
  const stream = useWikiEditStream()
  const { data: trends } = useBlueskyTrends()
  const { data: feed } = useFeaturedFeed()
  const trending = feed?.trending[0]
  return (
    <KeyValues divided>
      <KeyValue label={t('terminal.overview.news.trending', { wiki })}>
        {trending ? <>{trending.title}{trending.history.length > 1 && <> <Sparkline values={trending.history} /></>}</> : <Missing />}
      </KeyValue>
      <KeyValue label={t('terminal.overview.news.live')}>
        {stream
          ? <>{t('terminal.overview.news.perMinute', { count: stream.summary.perMinute })} <Sparkline values={bucketedPerSecond(stream.summary.perSecond)} /></>
          : <Missing />}
      </KeyValue>
      <KeyValue label={t('terminal.overview.news.bluesky')}>
        <span className="block overflow-hidden text-ellipsis whitespace-nowrap">{trends?.[0]?.name ?? '—'}</span>
      </KeyValue>
    </KeyValues>
  )
}

export function NewsCard({ className }: CardProps) {
  const { t, i18n } = useTranslation()
  const feed = useFeaturedFeed()
  const locale = intlLocale()
  const wiki = `${i18n.resolvedLanguage === 'pt' ? 'pt' : 'en'}.wikipedia`
  return (
    <QueryPanel id="5" title={t('terminal.overview.news.title')} query={feed} source="wikimedia feed" gap={8} onOpen={useOpen('/news')} className={className}>
      {(data) => (
        <>
          <DataTable columns="52px minmax(0,1fr)" gap="6px 12px">
            {data.headlines.slice(0, TOP_ROWS).map((headline) => (
              <TableRow key={headline.id}>
                <Cell className="text-dim">{headline.date ? formatShortDate(parseIsoDay(headline.date), locale, true) : '—'}</Cell>
                <Cell className="text-pretty">{headline.text}</Cell>
              </TableRow>
            ))}
          </DataTable>
          <NewsPulse wiki={wiki} />
        </>
      )}
    </QueryPanel>
  )
}

// ─── [6] tech ────────────────────────────────────────────────────────────────

export function TechCard({ className }: CardProps) {
  const { t } = useTranslation()
  const query = combineQueries(useTrendingRepos(), useHackerNewsFrontPage())
  return (
    <QueryPanel id="6" title={t('terminal.overview.tech.title')} query={query} source="github · hn" gap={8} onOpen={useOpen('/tech')} className={className}>
      {([repos, stories]) => (
        <>
          <DataTable columns="minmax(0,1fr) 88px 52px">
            {sortRepos(repos, 'starsDesc').slice(0, TOP_ROWS).map((repo) => (
              <TableRow key={repo.id}>
                <Cell truncate>{repo.name}</Cell>
                <Cell truncate className="text-dim">{repo.language?.toLowerCase() ?? '—'}</Cell>
                <Cell right>★{formatStars(repo.stars)}</Cell>
              </TableRow>
            ))}
          </DataTable>
          <PanelDivider>
            <DataTable columns="44px minmax(0,1fr)">
              {stories.slice(0, TOP_ROWS).map((story) => (
                <TableRow key={story.id}>
                  <Cell><ToneText tone="warn">▲{story.points}</ToneText></Cell>
                  <Cell truncate>{story.title}</Cell>
                </TableRow>
              ))}
            </DataTable>
          </PanelDivider>
        </>
      )}
    </QueryPanel>
  )
}
