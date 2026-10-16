import { motion } from 'framer-motion'
import { describeAqi } from '@/features/weather/lib/weather-format'
import type { AirQuality } from '@/features/weather/types'
import { useTranslation } from 'react-i18next'

export function AirQualityPanel({ air }: { air: AirQuality | null | undefined }) {
  const { t } = useTranslation()
  if (!air) return <p className="text-sm text-fg-subtle">{t('weather.air.unavailable')}</p>

  const aqiInfo = describeAqi(air.category)
  const pollutants = [
    { label: 'PM2.5', value: air.pm25, unit: 'µg/m³', limit: 25 },
    { label: 'PM10',  value: air.pm10, unit: 'µg/m³', limit: 50 },
    { label: 'NO₂',   value: air.no2,  unit: 'µg/m³', limit: 40 },
    { label: 'O₃',    value: air.o3,   unit: 'µg/m³', limit: 100 },
  ]

  return (
    <>
      <div className="flex items-center gap-4 px-4 py-3 rounded-xl flex-shrink-0"
        style={{ background: aqiInfo.color + '12', border: `1px solid ${aqiInfo.color}30` }}>
        <div className="text-5xl font-mono font-bold" style={{ color: aqiInfo.color }}>{air.aqi}</div>
        <div>
          <div className="text-sm font-semibold" style={{ color: aqiInfo.color }}>{t('weather.air.badge', { label: aqiInfo.label })}</div>
          <div className="text-[12px] text-fg-muted mt-0.5">{t('weather.air.index')}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 flex-shrink-0">
        {pollutants.map(({ label, value, unit, limit }) => {
          const ratio = value / limit
          const pct = Math.min(100, ratio * 100)
          // Color from the unclamped ratio: clamping first meant "over the limit" never showed red
          const color = ratio > 1 ? '#f43f5e' : ratio > 0.7 ? '#f59e0b' : '#10b981'
          return (
            <div key={label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex justify-between mb-2">
                <span className="text-[11px] text-fg-muted">{label}</span>
                <span className="text-[11px] font-mono text-white/60">{value.toFixed(1)} {unit}</span>
              </div>
              <div className="h-1 rounded-full bg-white/8">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: color }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
