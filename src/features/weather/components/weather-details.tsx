import { StatTile } from '@/components/ui/stat-tile'
import { uvLabel } from '@/features/weather/lib/weather-format'
import type { ForecastDay } from '@/features/weather/types'
import { useTranslation } from 'react-i18next'

export function WeatherDetails({ day }: { day: ForecastDay }) {
  const { t } = useTranslation()
  const uv = uvLabel(day.uvIndexMax)
  return (
    <div className="grid grid-cols-2 gap-2">
      <StatTile label={t('weather.details.sunrise')} value={day.sunrise?.slice(11, 16) ?? '—'} caption={t('weather.details.sun')} />
      <StatTile label={t('weather.details.sunset')} value={day.sunset?.slice(11, 16) ?? '—'} caption={t('weather.details.sun')} />
      <StatTile label={t('weather.details.uvIndex')} value={day.uvIndexMax.toFixed(0)} caption={uv.label} color={uv.color} />
      <StatTile label={t('weather.details.precipitation')} value={`${day.precipitationProb}%`} caption={t('weather.details.probability')} />
      <StatTile label={t('weather.details.max')} value={`${day.tempMax.toFixed(0)}°`} caption={t('weather.details.celsius')} />
      <StatTile label={t('weather.details.min')} value={`${day.tempMin.toFixed(0)}°`} caption={t('weather.details.celsius')} />
    </div>
  )
}
