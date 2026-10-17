import { expect, it } from 'vitest'
import type { CryptoAsset } from '@/features/crypto/types'
import type { Earthquake } from '@/features/earthquakes/types'
import type { AirQuality } from '@/features/weather/types'
import { thresholdAlerts } from './alert-rules'

const NOW = Date.parse('2026-10-16T18:00:00Z')
const HOUR = 3_600_000

const quake = (id: string, magnitude: number, time: number): Earthquake => ({
  id, magnitude, time, place: 'off the coast of Ecuador', depth: 10, location: { lat: 0, lng: -80 }, significance: 0, url: '', tsunamiRisk: false,
})
const air = (aqi: number): AirQuality => ({ location: { lat: -23.55, lng: -46.63 }, aqi, pm25: 0, pm10: 0, no2: 0, o3: 0, category: 'unhealthy', updatedAt: NOW })
const coin = (id: string, change24h: number) => ({ id, symbol: id, price: 10, change24h }) as CryptoAsset

it('alerts on quakes of M5 or more from the last 24 hours only', () => {
  const alerts = thresholdAlerts({ now: NOW, quakes: [quake('a', 5.0, NOW - HOUR), quake('b', 4.9, NOW - HOUR), quake('c', 6.1, NOW - 30 * HOUR)] })
  expect(alerts).toMatchObject([{ id: 'earthquake-a', severity: 'warning', params: { count: 2 } }])
})

it('alerts at aqi 100, kp 5 and a 10% move, and not below', () => {
  const below = thresholdAlerts({ now: NOW, air: air(99), kp: [{ time: '2026-10-16T15:00:00Z', kp: 4.67 }], coins: [coin('btc', 9.9), coin('eth', -9.9)] })
  expect(below).toEqual([])

  const above = thresholdAlerts({ now: NOW, air: air(100), kp: [{ time: '2026-10-16T15:00:00Z', kp: 5 }], coins: [coin('btc', 9.9), coin('eth', -10)] })
  expect(above.map((alert) => alert.type)).toEqual(['air_quality', 'geomagnetic', 'price_spike'])
  expect(above[2]).toMatchObject({ params: { symbol: 'ETH', change: '−10.00' } })
})

it('keeps ids stable across re-runs on the same day so the store does not duplicate them', () => {
  const input = { now: NOW, air: air(150), coins: [coin('sol', 12)] }
  expect(thresholdAlerts(input).map((alert) => alert.id)).toEqual(thresholdAlerts({ ...input, now: NOW + HOUR }).map((alert) => alert.id))
})
