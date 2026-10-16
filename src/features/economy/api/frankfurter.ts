import { useQuery } from '@tanstack/react-query'
import { fetchOk } from '@/lib/http'
import { queryKeys } from '@/lib/query-keys'
import type { FxSnapshot, SeriesPoint } from '@/features/economy/types'

// European Central Bank reference rates, published once per working day
const BASE_URL = 'https://api.frankfurter.dev/v1'
export const FX_CURRENCIES = ['BRL', 'EUR', 'GBP', 'JPY', 'CNY'] as const
export type FxCurrency = (typeof FX_CURRENCIES)[number]

export function parseFxSeries(raw: { rates?: Record<string, Record<string, number>> }, currency: string): SeriesPoint[] {
  return Object.entries(raw.rates ?? {})
    .filter(([, rates]) => Number.isFinite(rates[currency]))
    .map(([date, rates]) => ({ date, value: rates[currency] }))
    .sort((first, second) => first.date.localeCompare(second.date))
}

export function useFxLatest() {
  return useQuery({
    queryKey: queryKeys.economy.fxLatest(),
    queryFn: async ({ signal }): Promise<FxSnapshot> => {
      const raw = await (await fetchOk(`${BASE_URL}/latest?base=USD&symbols=${FX_CURRENCIES.join(',')}`, 'Frankfurter', { signal })).json()
      return { base: raw.base, date: raw.date, rates: raw.rates }
    },
    staleTime: 60 * 60_000,
  })
}

export function useFxHistory(currency: FxCurrency, days = 90) {
  return useQuery({
    queryKey: queryKeys.economy.fxHistory(currency, days),
    queryFn: async ({ signal }) => {
      const start = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10)
      return parseFxSeries(await (await fetchOk(`${BASE_URL}/${start}..?base=USD&symbols=${currency}`, 'Frankfurter', { signal })).json(), currency)
    },
    staleTime: 60 * 60_000,
  })
}
