import { useState } from 'react'
import { motion } from 'framer-motion'
import { WidgetShell } from '@/components/layout/widget-shell'
import { SegmentedTabs } from '@/components/ui/segmented-tabs'
import { tabPanel } from '@/components/ui/tab-panel'
import { useWeather } from '@/features/weather/api/open-meteo'
import { useAirQuality } from '@/features/weather/api/air-quality'
import { useGeoStore } from '@/store/geo-store'
import { getWMO } from '@/features/weather/lib/wmo-icons'
import { AirQualityPanel } from './air-quality-panel'
import { CitySearch } from './city-search'
import { HourlyForecastChart } from './hourly-forecast-chart'
import { WeatherDetails } from './weather-details'
import { ACCENT, describeAqi } from '@/features/weather/lib/weather-format'
import { StatTile } from '@/components/ui/stat-tile'
import { useTranslation } from 'react-i18next'
import { intlLocale } from '@/i18n'

type RightTab = '24h' | 'air' | 'details'

export function WeatherWidget({ isFocused = false }: { isFocused?: boolean }) {
  const { t } = useTranslation()
  const coords = useGeoStore((state) => state.coords)
  const placeName = useGeoStore((state) => state.placeName)

  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0)
  const [rightTab, setRightTab] = useState<RightTab>('24h')

  const { data: weather, isLoading, error, refetch, dataUpdatedAt } = useWeather(coords ?? undefined)
  const { data: air } = useAirQuality(coords ?? undefined)

  const current  = weather?.current
  const forecast = weather?.forecast ?? []
  const hourly   = weather?.hourly ?? []
  const wmo      = current ? getWMO(current.weatherCode) : null
  const aqiInfo  = air ? describeAqi(air.category) : null
  const selectedDay = forecast[selectedDayIdx] ?? forecast[0]

  const tabs: { id: RightTab; label: string }[] = [
    { id: '24h',     label: t('weather.tabs.hourly') },
    { id: 'air',     label: t('weather.tabs.air') },
    { id: 'details', label: t('weather.tabs.details') },
  ]

  return (
    <WidgetShell
      title={t('weather.title')}
      icon={<span className={isFocused ? 'text-2xl' : 'text-base'}>🌤</span>}
      isLoading={isLoading}
      error={error}
      onRetry={() => refetch()}
      lastUpdated={dataUpdatedAt || undefined}
      accentColor={ACCENT}
      isFocused={isFocused}
      fillHeight={isFocused}
    >
      {current && wmo && (
        <>
          {isFocused && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 flex-shrink-0">
              <span className="text-sm text-white/75">📍 {placeName ?? (coords ? t('weather.search.myLocation') : t('weather.search.default'))}</span>
              <CitySearch />
            </div>
          )}
          {/* ── Stats header ── */}
          <div className="grid grid-cols-2 sm:flex gap-2 mb-3 flex-shrink-0">
            <StatTile label={t('weather.stats.temperature')} value={`${current.temp.toFixed(0)}°`} caption={wmo.label} color={ACCENT} />

            <StatTile label={t('weather.stats.feelsLike')} value={`${current.feelsLike.toFixed(0)}°`} caption={t('weather.stats.thermal')} />

            {air && aqiInfo
              ? <StatTile label={t('weather.stats.aqi')} value={air.aqi} caption={aqiInfo.label} color={aqiInfo.color} />
              : <StatTile label={t('weather.stats.aqi')} value={t('weather.stats.notAvailable')} caption="—" />}

            <StatTile label={t('weather.stats.wind')} value={current.windSpeed.toFixed(0)} caption="km/h" />
          </div>

          {/* ── MODO COMPACTO ── */}
          {!isFocused && (
            <div className="flex flex-col gap-0.5">
              {forecast.slice(0, 7).map((day, i) => {
                const date = new Date(day.date)
                const dayName = i === 0 ? t('common.today') : date.toLocaleDateString(intlLocale(), { weekday: 'short' })
                const icon = getWMO(day.weatherCode).icon
                return (
                  <motion.div
                    key={day.date}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-white/4 transition-colors"
                  >
                    <span className="text-[12px] text-fg-muted capitalize w-10">{dayName}</span>
                    <span className="text-base leading-none">{icon}</span>
                    <div className="flex-1" />
                    {day.precipitationProb > 20 && (
                      <span className="text-[11px]" style={{ color: ACCENT }}>{day.precipitationProb}%</span>
                    )}
                    <span className="text-[12px] font-mono text-white/70">{day.tempMax.toFixed(0)}°</span>
                    <span className="text-[12px] font-mono text-fg-muted">{day.tempMin.toFixed(0)}°</span>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* ── MODO EXPANDIDO: tiling ── */}
          {isFocused && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col md:flex-row gap-4 flex-1 min-h-0"
            >
              {/* Coluna esquerda — previsão 7 dias */}
              <div className="w-full h-[38%] md:h-auto md:w-64 flex-shrink-0 flex flex-col min-h-0">
                <div className="flex flex-col gap-0.5 overflow-y-auto flex-1 min-h-0 pr-0.5">
                  {forecast.slice(0, 7).map((day, i) => {
                    const date = new Date(day.date)
                    const dayName = i === 0 ? t('common.today') : date.toLocaleDateString(intlLocale(), { weekday: 'long' })
                    const icon = getWMO(day.weatherCode).icon
                    const isSelected = selectedDayIdx === i
                    return (
                      <motion.div
                        key={day.date}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => { setSelectedDayIdx(i); setRightTab('details') }}
                        className="flex items-center gap-2.5 py-2 px-2 rounded-lg transition-colors cursor-pointer hover:bg-white/4 flex-shrink-0"
                        style={{
                          background: isSelected ? ACCENT + '14' : undefined,
                          outline: isSelected ? `1px solid ${ACCENT}38` : 'none',
                        }}
                      >
                        <span className="text-lg leading-none flex-shrink-0">{icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-medium text-white/75 capitalize">{dayName}</div>
                          <div className="flex gap-2 mt-0.5">
                            {day.precipitationProb > 20 && (
                              <span className="text-[11px]" style={{ color: ACCENT }}>💧{day.precipitationProb}%</span>
                            )}
                            <span className="text-[11px] text-fg-subtle">{t('weather.uvShort', { value: day.uvIndexMax.toFixed(0) })}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-[12px] font-mono text-white/75">{day.tempMax.toFixed(0)}°</span>
                          <span className="text-[12px] font-mono text-fg-muted ml-1">{day.tempMin.toFixed(0)}°</span>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>

              {/* Divisor */}
              <div className="h-px w-full md:h-auto md:w-px bg-white/6 flex-shrink-0" />

              {/* Coluna direita */}
              <div className="flex-1 min-w-0 flex flex-col gap-3">
                <SegmentedTabs tabs={tabs} active={rightTab} onChange={setRightTab} accent={ACCENT} />

                <div className="flex-1 min-h-0" style={{ position: 'relative' }}>
                  {/* Tab: 24h */}
                  <div {...tabPanel(rightTab === '24h')}>
                    <HourlyForecastChart hourly={hourly} />
                  </div>

                  {/* Tab: Qualidade do Ar */}
                  <div {...tabPanel(rightTab === 'air', { overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 })}>
                    <AirQualityPanel air={air} />
                  </div>

                  {/* Tab: Detalhes */}
                  <div {...tabPanel(rightTab === 'details', { overflowY: 'auto' })}>
                    {selectedDay && <WeatherDetails day={selectedDay} />}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </WidgetShell>
  )
}
