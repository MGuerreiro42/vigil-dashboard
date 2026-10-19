import type { CryptoAsset } from '@/features/crypto/types'
import type { Earthquake } from '@/features/earthquakes/types'
import type { KpReading } from '@/features/space/types'
import type { AirQuality } from '@/features/weather/types'
import { auroraLatitude, kpToScale } from '@/features/space/lib/geomagnetic'
import { AQI, CHANGE_PERCENT, KP, QUAKE_MAGNITUDE, severityOf } from '@/lib/alert-thresholds'
import { formatPrice, formatSigned } from '@/lib/terminal-format'
import type { Alert } from '@/store/alerts-store'


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

  const significant = quakes.filter((quake) => quake.magnitude >= QUAKE_MAGNITUDE.warning)
  for (const quake of significant.filter((candidate) => now - candidate.time <= QUAKE_WINDOW_MS)) {
    alerts.push({
      id: `earthquake-${quake.id}`,
      type: 'earthquake',
      severity: severityOf(quake.magnitude, QUAKE_MAGNITUDE) ?? 'warning',
      timestamp: quake.time,
      params: { magnitude: quake.magnitude.toFixed(1), place: quake.place, depth: Math.round(quake.depth), count: significant.length },
    })
  }

  if (air && air.aqi >= AQI.warning) {
    alerts.push({
      id: `air-${air.location.lat.toFixed(2)},${air.location.lng.toFixed(2)}-${localDay(now)}`,
      type: 'air_quality',
      severity: severityOf(air.aqi, AQI) ?? 'warning',
      timestamp: air.updatedAt,
      params: { aqi: air.aqi, band: air.category, city },
    })
  }

  const latestKp = kp.at(-1)
  if (latestKp && latestKp.kp >= KP.warning) {
    alerts.push({
      id: `kp-${latestKp.time}`,
      type: 'geomagnetic',
      severity: severityOf(latestKp.kp, KP) ?? 'warning',
      timestamp: Date.parse(latestKp.time),
      params: { kp: latestKp.kp, scale: kpToScale(latestKp.kp), latitude: auroraLatitude(latestKp.kp) },
    })
  }

  for (const coin of coins.filter((candidate) => Math.abs(candidate.change24h) >= CHANGE_PERCENT.warning)) {
    alerts.push({
      id: `price-${coin.id}-${localDay(now)}`,
      type: 'price_spike',
      severity: severityOf(Math.abs(coin.change24h), CHANGE_PERCENT) ?? 'warning',
      timestamp: now,
      params: { symbol: coin.symbol.toUpperCase(), change: formatSigned(coin.change24h), price: formatPrice(coin.price) },
    })
  }

  return alerts
}
