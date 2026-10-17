import { expect, it } from 'vitest'
import type { AirQuality } from '@/features/weather/types'
import { frameOffsets, pastRadarFrames, radarBbox, uvBand, worstPollutant } from './weather-terminal'

const air: AirQuality = { location: { lat: 0, lng: 0 }, aqi: 60, pm25: 11.1, pm10: 20, no2: 42.3, o3: 60, category: 'moderate', updatedAt: 0 }

it('picks the pollutant with the highest ratio to its WHO limit', () => {
  const worst = worstPollutant(air)
  expect(worst.pollutant).toBe('no2')
  expect(worst.ratio).toBeCloseTo(1.69, 2)
})

it('bands the UV index', () => {
  expect([2, 3, 6, 8, 11].map(uvBand)).toEqual(['low', 'moderate', 'high', 'veryHigh', 'extreme'])
})

it('centers the radar box on the city', () => {
  expect(radarBbox(-46.63, -23.55)).toEqual([-55.63, -29.05, -37.63, -18.05])
})

it('keeps the last 13 past frames and labels them in minutes before the newest', () => {
  const frames = Array.from({ length: 15 }, (_, index) => ({ time: index * 600, tileUrl: '' }))
  const past = pastRadarFrames(frames, 13 * 600)
  expect(past).toHaveLength(13)
  expect(frameOffsets(past)).toEqual([-120, -110, -100, -90, -80, -70, -60, -50, -40, -30, -20, -10, 0])
})
