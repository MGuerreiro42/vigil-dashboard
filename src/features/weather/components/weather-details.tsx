import { StatTile } from '@/components/ui/stat-tile'
import { uvLabel } from '@/features/weather/lib/weather-format'
import type { ForecastDay } from '@/features/weather/types'

export function WeatherDetails({ day }: { day: ForecastDay }) {
  const uv = uvLabel(day.uvIndexMax)
  return (
    <div className="grid grid-cols-2 gap-2">
      <StatTile label="🌅 Nascer" value={day.sunrise?.slice(11, 16) ?? '—'} caption="sol" />
      <StatTile label="🌇 Pôr" value={day.sunset?.slice(11, 16) ?? '—'} caption="sol" />
      <StatTile label="Índice UV" value={day.uvIndexMax.toFixed(0)} caption={uv.label} color={uv.color} />
      <StatTile label="Precipitação" value={`${day.precipitationProb}%`} caption="probabilidade" />
      <StatTile label="Máxima" value={`${day.tempMax.toFixed(0)}°`} caption="Celsius" />
      <StatTile label="Mínima" value={`${day.tempMin.toFixed(0)}°`} caption="Celsius" />
    </div>
  )
}
