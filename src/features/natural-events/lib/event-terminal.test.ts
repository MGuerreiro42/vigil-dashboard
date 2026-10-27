import { describe, expect, it } from 'vitest'
import type { NaturalEvent } from '@/features/natural-events/types'
import { countryCount, depthFromDescription, saffirSimpson, timelineAxis, timelineBuckets } from './event-terminal'

const HOUR = 3_600_000
const NOW = Date.UTC(2026, 9, 17, 12)

const event = (hoursAgo: number, alertLevel: NaturalEvent['alertLevel'], country = 'Chile'): NaturalEvent => ({
  id: `${hoursAgo}-${alertLevel}`,
  title: '',
  categoryId: 'wildfires',
  categoryTitle: 'wildfires',
  status: 'open',
  date: new Date(NOW - hoursAgo * HOUR).toISOString(),
  lat: 0,
  lng: 0,
  sourceUrl: null,
  magnitude: null,
  magnitudeUnit: null,
  description: null,
  alertLevel,
  country,
})

describe('saffirSimpson', () => {
  it('maps knots to the category boundaries', () => {
    expect([63, 64, 82, 83, 95, 96, 112, 113, 136, 137].map(saffirSimpson)).toEqual(['TS', 'C1', 'C1', 'C2', 'C2', 'C3', 'C3', 'C4', 'C4', 'C5'])
  })
})

describe('timelineBuckets', () => {
  it('keeps the highest alert per bucket, newest bucket last', () => {
    const buckets = timelineBuckets([event(1, 'Green'), event(2, 'Red'), event(4, 'Orange'), event(30, 'Green')], NOW, 4, 3 * HOUR)
    expect(buckets).toEqual([null, null, 'Orange', 'Red'])
  })

  it('ignores events older than the window or in the future', () => {
    expect(timelineBuckets([event(13, 'Red'), event(-1, 'Red')], NOW, 4, 3 * HOUR)).toEqual([null, null, null, null])
  })
})

describe('timelineAxis', () => {
  const dayLabel = (days: number) => `−${days}d`

  it('places day marks on the desktop grid', () => {
    const axis = timelineAxis(56, 7, 'agora', dayLabel)
    expect(axis).toHaveLength(56)
    expect([axis.indexOf('−7d'), axis.indexOf('−5d'), axis.indexOf('−3d'), axis.indexOf('−1d'), axis.indexOf('agora')]).toEqual([0, 16, 32, 48, 51])
  })

  it('drops the marks that would overlap "now" on the phone grid', () => {
    const axis = timelineAxis(28, 7, 'agora', dayLabel)
    expect(axis.includes('−1d')).toBe(false)
    expect(axis.indexOf('−3d')).toBe(16)
    expect(axis.endsWith('agora')).toBe(true)
  })
})

it('reads the depth from the GDACS severity text', () => {
  expect(depthFromDescription('Magnitude 5.2M, Depth:10km')).toBe(10)
  expect(depthFromDescription('Magnitude 0 ')).toBeNull()
})

it('counts each country once, splitting multi-country events', () => {
  expect(countryCount([event(1, 'Green', 'Chile'), event(2, 'Green', 'Chile, Argentina'), event(3, 'Green', '')])).toBe(2)
})
