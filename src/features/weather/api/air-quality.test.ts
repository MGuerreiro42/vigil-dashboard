import { expect, it } from 'vitest'
import { normalizeAirMeteo } from './air-quality'

const hourly = {
  time: ['2026-10-16T10:00', '2026-10-16T11:00', '2026-10-16T12:00'],
  pm2_5: [5, null, 9],
  pm10: [12, 14, 16],
  us_aqi: [40, 60, 160],
}

it('reads the latest past hour, walking back over gaps', () => {
  const now = new Date('2026-10-16T11:30').getTime()
  expect(normalizeAirMeteo({ hourly }, -23.5, -46.6, now)).toMatchObject({
    aqi: 60,
    category: 'moderate',
    pm10: 14,
    pm25: 5,
    updatedAt: now,
  })
})

it('falls back to the European index when the US one is missing', () => {
  const now = new Date('2026-10-16T12:30').getTime()
  const { aqi } = normalizeAirMeteo({ hourly: { ...hourly, us_aqi: [], european_aqi: [20, 30, 45] } }, 0, 0, now)
  expect(aqi).toBe(45)
})
