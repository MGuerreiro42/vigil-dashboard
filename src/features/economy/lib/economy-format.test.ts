import { describe, expect, it } from 'vitest'
import { fearGreedBand, fearGreedGauge, fearGreedTone, formatBrazil, formatDecimal, paddedRange, realRate } from './economy-format'

it('keeps Brazilian values in pt-BR and the rest in the given locale', () => {
  expect(formatBrazil(5.08281, 4)).toBe('5,0828')
  expect(formatBrazil(1234.5, 2)).toBe('1.234,50')
  expect(formatDecimal(0.88871, 4, 'en-US')).toBe('0.8887')
  expect(formatDecimal(158.02, 2, 'pt-BR')).toBe('158,02')
})

it('computes the real rate with the Fisher equation', () => {
  expect(realRate(13.75, 4.58).toFixed(2)).toBe('8.77')
})

describe('fear and greed', () => {
  it('names the alternative.me bands', () => {
    expect([10, 30, 50, 63, 90].map(fearGreedBand)).toEqual(['extremeFear', 'fear', 'neutral', 'greed', 'extremeGreed'])
  })

  it('colors fear red, neutral amber and greed green', () => {
    expect([44, 45, 55, 56].map(fearGreedTone)).toEqual(['err', 'warn', 'warn', 'ok'])
  })

  it('draws a ten-cell gauge in half cells', () => {
    expect(fearGreedGauge(63)).toEqual({ filled: '██████▌', rest: '███▌' })
    expect(fearGreedGauge(100)).toEqual({ filled: '██████████', rest: '' })
    expect(fearGreedGauge(0)).toEqual({ filled: '', rest: '██████████' })
  })
})

it('pads an axis range to whole units', () => {
  expect(paddedRange([4.1, 5.2], 0.2)).toEqual([3, 6])
  expect(paddedRange([52, 63, 50], 5)).toEqual([45, 68])
})
