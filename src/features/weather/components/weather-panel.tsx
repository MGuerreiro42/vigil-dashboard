import { useEffect, useId, useMemo, useState, type KeyboardEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { DotChart } from '@/components/charts/dot-chart'
import type { ChartAxis } from '@/components/charts/draw-dot-chart'
import { ChartLegend } from '@/components/terminal/chart-legend'
import { Cell, DataTable, TableRow } from '@/components/terminal/data-table'
import { PromptInput } from '@/components/terminal/prompt-input'
import { QueryPanel } from '@/components/terminal/query-panel'
import { Stat, StatLine } from '@/components/terminal/stat-line'
import { tabId, tabPanelId } from '@/components/terminal/tab-ids'
import { Tabs } from '@/components/terminal/tabs'
import { EmptyState, LegendGrid, PollutantBar, ToneText } from '@/components/terminal/text'
import { paddedRange } from '@/features/economy/lib/economy-format'
import { useAirQuality } from '@/features/weather/api/air-quality'
import { useCitySearch } from '@/features/weather/api/geocoding'
import { useWeather } from '@/features/weather/api/open-meteo'
import { aqiTone, POLLUTANT_LABEL, POLLUTANTS, precipTone, uvBand, uvTone, WHO_LIMITS, worstPollutant } from '@/features/weather/lib/weather-terminal'
import { conditionLabel } from '@/features/weather/lib/conditions'
import type { AirQuality, HourlyPoint, Place, WeatherData } from '@/features/weather/types'
import { useNow } from '@/hooks/use-now'
import { intlLocale } from '@/i18n'
import { formatAge, parseIsoDay } from '@/lib/terminal-format'
import { useGeoStore } from '@/store/geo-store'
import { useCityName } from '@/features/weather/lib/use-city-name'

type WeatherView = 'hourly' | 'air' | 'details'
const VIEWS: WeatherView[] = ['hourly', 'air', 'details']
const DEBOUNCE_MS = 300
const MIN_QUERY = 2
const MAX_HITS = 5
const LABEL_EVERY_HOURS = 4

const clockTime = (iso: string) => iso.slice(11, 16)
const decimal = (value: number, locale: string, digits = 1) => value.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits })

function CitySearch() {
  const { t } = useTranslation()
  const listId = useId()
  const setPlace = useGeoStore((state) => state.setPlace)
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const search = useCitySearch(debounced)
  const city = useCityName()
  const trimmed = query.trim()

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(trimmed), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [trimmed])

  const hits = (search.data ?? []).slice(0, MAX_HITS)
  const open = trimmed.length >= MIN_QUERY && debounced === trimmed && search.data !== undefined
  const choose = (place: Place) => {
    setPlace(place)
    setQuery('')
  }
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') setQuery('')
    if (!open || !hits.length) return
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => (index + (event.key === 'ArrowDown' ? 1 : -1) + hits.length) % hits.length)
    }
    if (event.key === 'Enter') choose(hits[Math.min(activeIndex, hits.length - 1)])
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-x-[16px] gap-y-[8px]">
        <span className="text-text">{city}</span>
        <PromptInput
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && hits.length ? `${listId}-${Math.min(activeIndex, hits.length - 1)}` : undefined}
          aria-label={t('terminal.planet.weather.search')}
          placeholder={t('terminal.planet.weather.search')}
          value={query}
          onChange={(event) => { setQuery(event.target.value); setActiveIndex(0) }}
          onKeyDown={onKeyDown}
        />
      </div>
      {open && (
        <div className="flex flex-col border border-line px-[10px] py-[6px]">
          {hits.length === 0 ? (
            <EmptyState title={t('terminal.planet.weather.noCity', { query: trimmed })} hint={t('terminal.planet.weather.noCityHint')} />
          ) : (
            <ul id={listId} role="listbox" aria-label={t('terminal.planet.weather.cities')}>
              {hits.map((place, index) => (
                <li
                  key={place.id}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  onPointerDown={(event) => event.preventDefault()}
                  onClick={() => choose(place)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`flex min-h-[32px] cursor-pointer items-center justify-between gap-[12px] ${index === activeIndex ? 'bg-row-selected' : ''}`}
                >
                  <span>{place.name}</span>
                  <span className="min-w-0 truncate text-dim">{place.region}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  )
}

function weekday(isoDay: string, locale: string) {
  return parseIsoDay(isoDay).toLocaleDateString(locale, { weekday: 'short' }).replace('.', '').toLowerCase()
}

function Forecast({ weather }: { weather: WeatherData }) {
  const { t } = useTranslation()
  const locale = intlLocale()
  const columns = 'terminal.planet.weather.columns'
  return (
    <DataTable
      columns="40px minmax(0,1fr) 72px 44px 40px"
      gap="0 12px"
      header={[{ label: t(`${columns}.day`) }, { label: t(`${columns}.sky`) }, { label: t(`${columns}.hiLo`), right: true }, { label: t(`${columns}.rain`), right: true }, { label: t(`${columns}.uv`), right: true }]}
    >
      {weather.forecast.map((day, index) => (
        <TableRow key={day.date}>
          <Cell className={index === 0 ? 'text-ok' : 'text-dim'}>{index === 0 ? t('terminal.planet.weather.today') : weekday(day.date, locale)}</Cell>
          <Cell>{conditionLabel(day.weatherCode)}</Cell>
          <Cell right>{Math.round(day.tempMax)}°/{Math.round(day.tempMin)}°</Cell>
          <Cell right><ToneText tone={precipTone(day.precipitationProb)}>{day.precipitationProb ? `${day.precipitationProb}%` : '—'}</ToneText></Cell>
          <Cell right><ToneText tone={uvTone(day.uvIndexMax)}>{Math.round(day.uvIndexMax)}</ToneText></Cell>
        </TableRow>
      ))}
    </DataTable>
  )
}

const formatDegrees = (value: number) => `${value.toFixed(0)}°`
const formatPercent = (value: number) => `${value.toFixed(0)}%`

function HourlyChart({ hourly }: { hourly: HourlyPoint[] }) {
  const { t } = useTranslation()
  const [cursor, setCursor] = useState<number | null>(null)
  const temps = useMemo(() => hourly.map((point) => point.temp), [hourly])
  const series = useMemo(() => [{ data: temps, color: '--color-info' }], [temps])
  const rightAxis = useMemo<ChartAxis>(() => ({ min: 0, max: 100, format: formatPercent, series: [{ data: hourly.map((point) => point.precipProb), color: '--color-text' }] }), [hourly])
  const xLabels = useMemo(() => hourly.filter((_, index) => index % LABEL_EVERY_HOURS === 0).map((point) => `${point.time.slice(11, 13)}h`), [hourly])
  const [min, max] = paddedRange(temps, 1)
  const point = cursor === null ? null : hourly[cursor]

  return (
    <>
      <LegendGrid minItem={200}>
        <span><ToneText className="font-semibold" tone="info">■</ToneText> {t('terminal.planet.weather.tempLegend')}</span>
        <span><ToneText className="font-semibold" tone="text">■</ToneText> {t('terminal.planet.weather.rainLegend')}</span>
      </LegendGrid>
      <DotChart label={t('terminal.planet.weather.chartLabel')} series={series} min={min} max={max} format={formatDegrees} xLabels={xLabels} rightAxis={rightAxis} height="200px" onCursorChange={setCursor} />
      <ChartLegend readout={point && t('terminal.planet.weather.readout', { time: clockTime(point.time), temp: point.temp.toFixed(1), rain: point.precipProb })} />
    </>
  )
}

function AirView({ air }: { air: AirQuality }) {
  const { t } = useTranslation()
  const locale = intlLocale()
  const worst = worstPollutant(air)
  const worstLabel = POLLUTANT_LABEL[worst.pollutant]
  return (
    <>
      <span>
        {t('terminal.planet.weather.aqi')} <ToneText tone={aqiTone(air.category)}>{air.aqi} {t(`terminal.planet.weather.aqiBands.${air.category}`)}</ToneText>{' '}
        <ToneText tone="dim">{t('terminal.planet.weather.whoNote')}</ToneText>
      </span>
      <DataTable columns="56px minmax(0,1fr) auto auto" gap="2px 12px">
        {POLLUTANTS.map((pollutant) => {
          const value = air[pollutant]
          const limit = WHO_LIMITS[pollutant]
          return (
            <TableRow key={pollutant}>
              <Cell>{POLLUTANT_LABEL[pollutant]}</Cell>
              <Cell className="overflow-hidden"><PollutantBar value={value} limit={limit} /></Cell>
              <Cell right><ToneText tone={value > limit ? 'err' : 'ok'}>{decimal(value, locale)} µg/m³</ToneText></Cell>
              <Cell right className="text-dim">{t('terminal.planet.weather.whoLimit', { window: pollutant === 'o3' ? '8 h' : '24 h', limit })}</Cell>
            </TableRow>
          )
        })}
      </DataTable>
      <span className="text-dim">
        {worst.ratio > 1
          ? t('terminal.planet.weather.overLimit', { pollutant: worstLabel, ratio: decimal(worst.ratio, locale) })
          : t('terminal.planet.weather.underLimit', { pollutant: worstLabel })}
      </span>
    </>
  )
}

function Details({ weather }: { weather: WeatherData }) {
  const { t } = useTranslation()
  const today = weather.forecast[0]
  if (!today) return null
  const item = (label: 'sunrise' | 'sunset' | 'uvIndex' | 'precipitation' | 'high' | 'low', value: ReactNode) => <span><span className="text-dim">{t(`terminal.planet.weather.${label}`)}</span> {value}</span>
  return (
    <div className="grid gap-x-[24px] gap-y-[2px]" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))' }}>
      {item('sunrise', clockTime(today.sunrise))}
      {item('sunset', clockTime(today.sunset))}
      {item('uvIndex', <ToneText tone={uvTone(today.uvIndexMax)}>{Math.round(today.uvIndexMax)} {t(`terminal.planet.weather.uvBands.${uvBand(today.uvIndexMax)}`)}</ToneText>)}
      {item('precipitation', `${today.precipitationProb}%`)}
      {item('high', `${Math.round(today.tempMax)} °C`)}
      {item('low', `${Math.round(today.tempMin)} °C`)}
    </div>
  )
}

function WeatherBody({ weather, air, airFailed, view, onView }: { weather: WeatherData; air: AirQuality | undefined; airFailed: boolean; view: WeatherView; onView: (view: WeatherView) => void }) {
  const { t } = useTranslation()
  const tabsId = useId()
  const { current } = weather
  const airMissing = airFailed
    ? <EmptyState title={t('terminal.planet.weather.airUnavailable')} hint={t('terminal.planet.weather.airUnavailableHint')} />
    : <span className="text-dim">{t('terminal.panel.waiting', { source: 'open-meteo air quality' })}<span className="animate-blink text-ok" aria-hidden>▌</span></span>
  const views: Record<WeatherView, ReactNode> = {
    hourly: <HourlyChart hourly={weather.hourly} />,
    air: air ? <AirView air={air} /> : airMissing,
    details: <Details weather={weather} />,
  }

  return (
    <>
      <StatLine>
        <Stat label={t('terminal.planet.weather.temp')}><ToneText tone="info">{Math.round(current.temp)}°</ToneText> {conditionLabel(current.weatherCode)}</Stat>
        <Stat label={t('terminal.planet.weather.feels')} priority="p2">{Math.round(current.feelsLike)}°</Stat>
        {air && <Stat label={t('terminal.planet.weather.aqi')}><ToneText tone={aqiTone(air.category)}>{air.aqi}</ToneText> {t(`terminal.planet.weather.aqiBands.${air.category}`)}</Stat>}
        <Stat label={t('terminal.planet.weather.wind')} priority="p2">{Math.round(current.windSpeed)} km/h</Stat>
      </StatLine>
      <Forecast weather={weather} />
      <Tabs label={t('terminal.planet.weather.tabs.label')} idBase={tabsId} value={view} onChange={onView} items={VIEWS.map((id) => ({ id, label: t(`terminal.planet.weather.tabs.${id}`) }))} />
      <div role="tabpanel" id={tabPanelId(tabsId, view)} aria-labelledby={tabId(tabsId, view)} className="flex min-w-0 flex-col gap-[12px]">
        {views[view]}
      </div>
    </>
  )
}

/** [3.3] Current weather, 7-day forecast, 24 h chart, air quality against WHO limits, and city search. */
export function WeatherPanel() {
  const { t } = useTranslation()
  const coords = useGeoStore((state) => state.coords) ?? undefined
  const weather = useWeather(coords)
  const air = useAirQuality(coords)
  const now = useNow(1_000)
  const [view, setView] = useState<WeatherView>('hourly')

  return (
    <QueryPanel id="3.3" title={t('terminal.planet.weather.title')} gap={12} meta={`open-meteo · ${formatAge(now - weather.dataUpdatedAt)}`} query={weather} source="open-meteo">
      {(data) => (
        <>
          <CitySearch />
          <WeatherBody weather={data} air={air.data} airFailed={air.isError} view={view} onView={setView} />
        </>
      )}
    </QueryPanel>
  )
}
