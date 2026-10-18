import { describe, expect, it } from 'vitest'
import type { NaturalEvent } from '@/features/natural-events/types'
import { countryCount, depthFromDescription, highAlertCounts, saffirSimpson, timelineAxis, timelineBuckets, timelineGrid } from './event-terminal'

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

describe('timelineGrid', () => {
  const CH = 7.2

  it('keeps 3 h buckets while 56 columns fit', () => {
    expect(timelineGrid(60 * CH, CH, 7)).toEqual({ columns: 56, hours: 3 })
  })

  it('grows the bucket to 6 h and then 12 h on narrower tracks', () => {
    // 390px phone: 358px panel minus the 2ch label, the 4ch count and two 8px gaps
    expect(timelineGrid(358 - 6 * CH - 16, CH, 7)).toEqual({ columns: 28, hours: 6 })
    expect(timelineGrid(20 * CH, CH, 7)).toEqual({ columns: 14, hours: 12 })
  })

  it('shows the newest 12 h columns when not even 7 days of 12 h fit', () => {
    expect(timelineGrid(9.5 * CH, CH, 7)).toEqual({ columns: 9, hours: 12 })
  })

  it('falls back to the widest grid before the font is measured', () => {
    expect(timelineGrid(0, 0, 7)).toEqual({ columns: 56, hours: 3 })
  })
})

describe('timelineAxis', () => {
  const dayLabel = (days: number) => `−${days}d`

  it('labels start, middle and now on the desktop grid', () => {
    const axis = timelineAxis(56, 3, 'agora', dayLabel)
    expect(axis).toHaveLength(56)
    expect([axis.indexOf('−7d'), axis.indexOf('−3d'), axis.indexOf('agora')]).toEqual([0, 32, 51])
  })

  it('puts the middle mark at 4/7 on the phone grid', () => {
    const axis = timelineAxis(28, 6, 'agora', dayLabel)
    expect(axis.trim().split(/ +/)).toEqual(['−7d', '−3d', 'agora'])
    expect(axis.indexOf('−3d')).toBe(16)
    expect(axis.endsWith('agora')).toBe(true)
  })

  it('drops the marks that do not fit a short window', () => {
    expect(timelineAxis(9, 12, 'agora', dayLabel).trim().split(/ +/)).toEqual(['−4d', 'agora'])
  })
})

it('reads the depth from the GDACS severity text', () => {
  expect(depthFromDescription('Magnitude 5.2M, Depth:10km')).toBe(10)
  expect(depthFromDescription('Magnitude 0 ')).toBeNull()
})

it('counts each country once, splitting multi-country events', () => {
  expect(countryCount([event(1, 'Green', 'Chile'), event(2, 'Green', 'Chile, Argentina'), event(3, 'Green', '')])).toBe(2)
})

describe('highAlertCounts', () => {
  it('counts orange and red apart and leaves out empty colours', () => {
    expect(highAlertCounts([event(1, 'Orange'), event(2, 'Green'), event(3, 'Orange')])).toEqual([['Orange', 2]])
    expect(highAlertCounts([event(1, 'Red'), event(2, 'Orange')])).toEqual([['Orange', 1], ['Red', 1]])
    expect(highAlertCounts([event(1, 'Green')])).toEqual([])
  })
})
