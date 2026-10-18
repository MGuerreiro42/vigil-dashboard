import type { CryptoAsset } from '@/features/crypto/types'
import type { Earthquake } from '@/features/earthquakes/types'
import type { KpReading } from '@/features/space/types'
import type { AirQuality } from '@/features/weather/types'
import { auroraLatitude, kpToScale } from '@/features/space/lib/geomagnetic'
import { formatPrice, formatSigned } from '@/lib/terminal-format'
import type { Alert } from '@/store/alerts-store'

// The four thresholds named in the empty alerts popover
export const QUAKE_MAGNITUDE = 5
export const AQI_LIMIT = 100
export const KP_LIMIT = 5
export const CHANGE_PERCENT = 10

const QUAKE_WINDOW_MS = 24 * 3_600_000

export interface AlertInput {
  now: number
  quakes?: Earthquake[]
  air?: AirQuality
  city?: string
  kp?: KpReading[]
  coins?: CryptoAsset[]
}

type NewAlert = Omit<Alert, 'read'>

const localDay = (time: number) => new Date(time).toLocaleDateString('sv')

/** Alerts for every threshold crossed in the latest data; ids are stable so the store dedupes re-runs. */
export function thresholdAlerts({ now, quakes = [], air, city = '', kp = [], coins = [] }: AlertInput): NewAlert[] {
  const alerts: NewAlert[] = []

  const significant = quakes.filter((quake) => quake.magnitude >= QUAKE_MAGNITUDE)
  for (const quake of significant.filter((candidate) => now - candidate.time <= QUAKE_WINDOW_MS)) {
    alerts.push({
      id: `earthquake-${quake.id}`,
      type: 'earthquake',
      severity: quake.magnitude >= 6 ? 'critical' : 'warning',
      timestamp: quake.time,
      params: { magnitude: quake.magnitude.toFixed(1), place: quake.place, depth: Math.round(quake.depth), count: significant.length },
    })
  }

  if (air && air.aqi >= AQI_LIMIT) {
    alerts.push({
      id: `air-${air.location.lat.toFixed(2)},${air.location.lng.toFixed(2)}-${localDay(now)}`,
      type: 'air_quality',
      severity: air.aqi > 200 ? 'critical' : 'warning',
      timestamp: air.updatedAt,
      params: { aqi: air.aqi, band: air.category, city },
    })
  }

  const latestKp = kp.at(-1)
  if (latestKp && latestKp.kp >= KP_LIMIT) {
    alerts.push({
      id: `kp-${latestKp.time}`,
      type: 'geomagnetic',
      severity: latestKp.kp >= 7 ? 'critical' : 'warning',
      timestamp: Date.parse(latestKp.time),
      params: { kp: latestKp.kp, scale: kpToScale(latestKp.kp), latitude: auroraLatitude(latestKp.kp) },
    })
  }

  for (const coin of coins.filter((candidate) => Math.abs(candidate.change24h) >= CHANGE_PERCENT)) {
    alerts.push({
      id: `price-${coin.id}-${localDay(now)}`,
      type: 'price_spike',
      severity: Math.abs(coin.change24h) >= 20 ? 'critical' : 'warning',
      timestamp: now,
      params: { symbol: coin.symbol.toUpperCase(), change: formatSigned(coin.change24h), price: formatPrice(coin.price) },
    })
  }

  return alerts
}
