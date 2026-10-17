import { expect, it } from 'vitest'
import { parseFxSeries } from './frankfurter'
import { parseBcbSeries } from './bcb'
import { parseFearGreed } from './crypto-pulse'

it('orders an FX time series by date and keeps only the asked currency', () => {
  expect(parseFxSeries({ rates: { '2026-10-16': { BRL: 5.08 }, '2026-10-15': { BRL: 5.05, EUR: 0.88 }, '2026-10-14': { EUR: 0.89 } } }, 'BRL'))
    .toEqual([{ date: '2026-10-15', value: 5.05 }, { date: '2026-10-16', value: 5.08 }])
})

it('converts Banco Central rows to ISO dates and numbers', () => {
  expect(parseBcbSeries([{ data: '16/10/2026', valor: '13.75' }, { data: '01/09/2026', valor: '-0.32' }, { data: '01/08/2026', valor: '' }]))
    .toEqual([{ date: '2026-10-16', value: 13.75 }, { date: '2026-09-01', value: -0.32 }])
})

it('reads the latest Fear & Greed value and an oldest-first history', () => {
  const fearGreed = parseFearGreed({ data: [
    { value: '63', value_classification: 'Greed', timestamp: '1792108800' },
    { value: '53', value_classification: 'Neutral', timestamp: '1792022400' },
  ] })
  expect(fearGreed).toMatchObject({ value: 63, classification: 'Greed' })
  expect(fearGreed.history.map((point) => point.value)).toEqual([53, 63])
})

