import { describe, expect, it } from 'vitest'
import type { Earthquake } from '@/features/earthquakes/types'
import { depthHistogram, formatLonLat, quakeBand, quakeBandCounts, quakeGlyph, quakeTone, shallowShare, shortPlace } from './quake-terminal'

const quake = (magnitude: number, depth: number): Earthquake => ({
  id: `${magnitude}-${depth}`, magnitude, depth, place: '', time: 0, location: { lat: 0, lng: 0 }, significance: 0, url: '', tsunamiRisk: false,
})

describe('quakeBand', () => {
  it('splits at 3, 4.5 and 6', () => {
    expect([2.9, 3, 4.4, 4.5, 5.9, 6].map(quakeBand)).toEqual(['minor', 'moderate', 'moderate', 'strong', 'strong', 'severe'])
    expect([2, 3.2, 5, 6.9].map(quakeGlyph)).toEqual(['·', 'o', 'O', '@'])
    expect([2, 3.2, 5, 6.9].map(quakeTone)).toEqual(['dim', 'text', 'warn', 'err'])
  })

  it('counts quakes per band', () => {
    expect(quakeBandCounts([quake(2.6, 0), quake(2.9, 0), quake(4.5, 0), quake(6.9, 0)])).toEqual({ severe: 1, strong: 1, moderate: 0, minor: 2 })
  })
})

it('buckets depths with their mean magnitude', () => {
  const histogram = depthHistogram([quake(3, 10), quake(5, 20), quake(4, 135)])
  expect(histogram.map((bucket) => [bucket.count, bucket.meanMagnitude])).toEqual([[2, 4], [0, null], [1, 4], [0, null]])
  expect(shallowShare([quake(3, 10), quake(5, 20), quake(4, 135)])).toBe(67)
})

it('shortens USGS place names to the locality', () => {
  expect(shortPlace('76 km NE of Ozernovskiy, RU')).toBe('Ozernovskiy')
  expect(shortPlace('off the coast of Ecuador')).toBe('Ecuador')
  expect(shortPlace('Auckland Islands, NZ')).toBe('Auckland Islands')
})

it('formats coordinates with hemispheres', () => {
  expect(formatLonLat(-46.63, -23.55)).toBe('23.6S 46.6W')
  expect(formatLonLat(139.7, 35.7)).toBe('35.7N 139.7E')
})
