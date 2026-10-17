import type { Tone } from '@/lib/terminal-format'

// Decision 12: Brazilian values keep pt-BR separators in every UI language
const BRAZIL_LOCALE = 'pt-BR'

export function formatDecimal(value: number, digits: number, locale: string): string {
  return value.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

export const formatBrazil = (value: number, digits: number) => formatDecimal(value, digits, BRAZIL_LOCALE)

/** Real interest rate by the Fisher equation, as the design shows (13,75% vs 4,58% → 8,77%). */
export function realRate(nominalPercent: number, inflationPercent: number): number {
  return ((1 + nominalPercent / 100) / (1 + inflationPercent / 100) - 1) * 100
}

export type FearGreedBand = 'extremeFear' | 'fear' | 'neutral' | 'greed' | 'extremeGreed'

export function fearGreedBand(value: number): FearGreedBand {
  if (value < 25) return 'extremeFear'
  if (value < 45) return 'fear'
  if (value < 55) return 'neutral'
  if (value < 75) return 'greed'
  return 'extremeGreed'
}

/** Decision 19: fear red, neutral amber, greed green. */
export function fearGreedTone(value: number): Tone {
  if (value < 45) return 'err'
  if (value <= 55) return 'warn'
  return 'ok'
}

const GAUGE_CELLS = 10

/** Ten-cell gauge in half-cell steps: 63 → filled "██████▌", rest "███▌". */
export function fearGreedGauge(value: number) {
  const halves = Math.max(0, Math.min(GAUGE_CELLS * 2, Math.round(value / 5)))
  const cells = (count: number) => '█'.repeat(Math.floor(count / 2)) + (count % 2 ? '▌' : '')
  return { filled: cells(halves), rest: cells(GAUGE_CELLS * 2 - halves) }
}

/** Axis range a little wider than the data, on whole units. */
export function paddedRange(values: number[], padding: number): [low: number, high: number] {
  return [Math.floor(Math.min(...values) - padding), Math.ceil(Math.max(...values) + padding)]
}

export function percentChange(first: number, last: number): number {
  return (last / first - 1) * 100
}
