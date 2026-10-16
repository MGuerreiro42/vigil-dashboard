

export const ACCENT = '#f59e0b'

export function formatPrice(price: number): string {
  if (price >= 1000) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  if (price >= 1)    return `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
  return `$${price.toLocaleString('en-US', { maximumFractionDigits: 4 })}`
}

export const USD_COMPACT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
})

export function formatMarketCap(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
  if (value >= 1e9)  return `$${(value / 1e9).toFixed(1)}B`
  return `$${(value / 1e6).toFixed(0)}M`
}
