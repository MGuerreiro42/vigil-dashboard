import { describe, expect, it } from 'vitest'
import { fixedLabelCount, layoutLabels, placeLabel, type LabelRequest } from './marker-labels'

// Monospace stand-in: 7px per character
const measure = (text: string) => text.length * 7

describe('placeLabel', () => {
  it('sits 14px right of the marker by default', () => {
    expect(placeLabel(100, '6.9 Ozernovskiy', measure, 600)).toEqual({ text: '6.9 Ozernovskiy', textX: 114, textWidth: 105 })
  })

  it('flips left, right-aligned, when it would pass the right edge minus 8px', () => {
    expect(placeLabel(500, '6.9 Ozernovskiy', measure, 600)).toEqual({ text: '6.9 Ozernovskiy', textX: 381, textWidth: 105 })
  })

  it('falls back to the magnitude, then to no label', () => {
    expect(placeLabel(60, '6.9 Ozernovskiy', measure, 130)?.text).toBe('6.9')
    expect(placeLabel(20, '6.9 Ozernovskiy', measure, 40)).toBeNull()
  })
})

it('fixes the label count by map width', () => {
  expect([300, 359, 360, 719, 720].map(fixedLabelCount)).toEqual([0, 0, 1, 1, 3])
})

describe('layoutLabels', () => {
  const quake = (x: number, y: number, rank: number, pinned = false): LabelRequest => ({ x, y, text: `${rank}`, color: 'err', rank, pinned })

  it('keeps the strongest within the quota for the width', () => {
    const requests = [quake(10, 10, 5), quake(10, 60, 7), quake(10, 110, 6), quake(10, 160, 6.5)]
    expect(layoutLabels(requests, measure, 800).map((label) => label.text)).toEqual(['7', '6.5', '6'])
    expect(layoutLabels(requests, measure, 400).map((label) => label.text)).toEqual(['7'])
    expect(layoutLabels(requests, measure, 300)).toEqual([])
  })

  it('drops the weaker of two overlapping labels', () => {
    expect(layoutLabels([quake(10, 10, 6), quake(12, 14, 7)], measure, 800).map((label) => label.text)).toEqual(['7'])
  })

  it('always labels the pinned marker, even below 360px and over a stronger one', () => {
    const labels = layoutLabels([quake(12, 14, 7), quake(10, 10, 4, true)], measure, 300)
    expect(labels.map((label) => label.text)).toEqual(['4'])
  })

  it('always tries unranked labels such as a place name', () => {
    expect(layoutLabels([{ x: 10, y: 10, text: 'iss', color: 'info' }], measure, 200).map((label) => label.text)).toEqual(['iss'])
  })
})
