import { describe, expect, it } from 'vitest'
import { chartLayout, indexAtX, interpolateAt, valueRange, visibleXLabelIndices } from './dot-chart-math'

describe('visibleXLabelIndices', () => {
  const labels = ['22h', '02h', '06h', '10h', '14h', '18h', '22h']

  it('keeps every label when there is room', () => {
    expect(visibleXLabelIndices(labels, 600)).toEqual([0, 1, 2, 3, 4, 5, 6])
  })

  it('keeps first, middle and last when labels would be closer than 64px', () => {
    expect(visibleXLabelIndices(labels, 300)).toEqual([0, 3, 6])
  })

  it('skips empty placeholder labels', () => {
    expect(visibleXLabelIndices(['set 25', '', '', 'mar 26', '', '', 'set 26'], 600)).toEqual([0, 3, 6])
  })
})

describe('chartLayout and indexAtX', () => {
  const layout = chartLayout(400, 150, { padLeft: 52, hasRightAxis: true, count: 25 })

  it('reserves the right axis gutter', () => {
    expect(layout).toMatchObject({ left: 52, plotWidth: 304, plotHeight: 118 })
  })

  it('maps pointer x to the nearest data index, clamped', () => {
    expect(indexAtX(52, layout)).toBe(0)
    expect(indexAtX(52 + 152, layout)).toBe(12)
    expect(indexAtX(5, layout)).toBe(0)
    expect(indexAtX(999, layout)).toBe(24)
  })
})

describe('series helpers', () => {
  it('interpolates between points', () => {
    expect(interpolateAt([10, 20, 40], 1.5)).toBe(30)
    expect(interpolateAt([10, 20, 40], 2)).toBe(40)
  })

  it('uses explicit bounds over the data range', () => {
    expect(valueRange([3, 9, 5])).toEqual([3, 9])
    expect(valueRange([3, 9, 5], 0, 100)).toEqual([0, 100])
  })
})
