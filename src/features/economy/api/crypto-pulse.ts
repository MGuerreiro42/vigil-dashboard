import { useQuery } from '@tanstack/react-query'
import { fetchOk } from '@/lib/http'
import { queryKeys } from '@/lib/query-keys'
import type { BitcoinFees, CryptoGlobal, FearGreed } from '@/features/economy/types'

type RawFearGreed = { data: { value: string; value_classification: string; timestamp: string }[] }

export function parseFearGreed(raw: RawFearGreed): FearGreed {
  const history = raw.data
    .map((day) => ({ date: new Date(Number(day.timestamp) * 1000).toISOString().slice(0, 10), value: Number(day.value) }))
    .sort((first, second) => first.date.localeCompare(second.date))
  const latest = raw.data[0]
  return { value: Number(latest.value), classification: latest.value_classification, history }
}

export function useFearGreed() {
  return useQuery({
    queryKey: queryKeys.economy.fearGreed(),
    queryFn: async ({ signal }) => parseFearGreed(await (await fetchOk('https://api.alternative.me/fng/?limit=30', 'Alternative.me', { signal })).json()),
    staleTime: 60 * 60_000,
  })
}

export function useCryptoGlobal() {
  return useQuery({
    queryKey: queryKeys.economy.cryptoGlobal(),
    queryFn: async ({ signal }): Promise<CryptoGlobal> => {
      const raw = await (await fetchOk('https://api.coinpaprika.com/v1/global', 'Coinpaprika', { signal })).json()
      return { marketCapUsd: raw.market_cap_usd, volume24hUsd: raw.volume_24h_usd, btcDominance: raw.bitcoin_dominance_percentage }
    },
    staleTime: 10 * 60_000,
    refetchInterval: 10 * 60_000,
  })
}

export function useBitcoinFees() {
  return useQuery({
    queryKey: queryKeys.economy.bitcoinFees(),
    queryFn: async ({ signal }): Promise<BitcoinFees> => {
      const raw = await (await fetchOk('https://mempool.space/api/v1/fees/recommended', 'mempool.space', { signal })).json()
      return { fastest: raw.fastestFee, halfHour: raw.halfHourFee, hour: raw.hourFee }
    },
    staleTime: 60_000,
    refetchInterval: 2 * 60_000,
  })
}
