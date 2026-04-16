import { useQuery } from '@tanstack/react-query'
import type { CryptoAsset, ExchangeRates } from './types/crypto'

const BASE = 'https://api.coingecko.com/api/v3'

const DEFAULT_IDS = [
  'bitcoin', 'ethereum', 'binancecoin', 'ripple', 'solana',
  'cardano', 'avalanche-2', 'chainlink', 'polkadot', 'litecoin',
  'cosmos', 'near', 'uniswap', 'stellar', 'monero',
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeCoin(raw: any): CryptoAsset {
  return {
    id: raw.id,
    symbol: raw.symbol?.toUpperCase() ?? '',
    name: raw.name ?? '',
    price: raw.current_price ?? 0,
    marketCap: raw.market_cap ?? 0,
    volume24h: raw.total_volume ?? 0,
    change24h: raw.price_change_percentage_24h ?? 0,
    change7d: raw.price_change_percentage_7d_in_currency ?? 0,
    sparkline: raw.sparkline_in_7d?.price ?? [],
    rank: raw.market_cap_rank ?? 0,
    imageUrl: raw.image ?? '',
  }
}

async function fetchCryptoMarket(ids: string[]): Promise<CryptoAsset[]> {
  const params = new URLSearchParams({
    vs_currency: 'usd',
    ids: ids.join(','),
    sparkline: 'true',
    price_change_percentage: '24h,7d',
    order: 'market_cap_desc',
  })
  const res = await fetch(`${BASE}/coins/markets?${params}`)
  if (!res.ok) throw new Error(`CoinGecko: ${res.status}`)
  const raw = await res.json()
  return raw.map(normalizeCoin)
}

async function fetchExchangeRates(): Promise<ExchangeRates> {
  // open.er-api.com: free tier, CORS-enabled, no API key required
  const res = await fetch('https://open.er-api.com/v6/latest/USD')
  if (!res.ok) throw new Error(`ExchangeRate: ${res.status}`)
  const raw = await res.json()
  const { EUR, BRL, GBP, JPY } = raw.rates as Record<string, number>
  return {
    base: raw.base_code,
    date: new Date(raw.time_last_update_unix * 1000).toISOString().slice(0, 10),
    rates: { EUR, BRL, GBP, JPY },
    updatedAt: Date.now(),
  }
}

export function useCryptoMarket(ids: string[] = DEFAULT_IDS) {
  return useQuery({
    queryKey: ['crypto', 'market', ids],
    queryFn: () => fetchCryptoMarket(ids),
    staleTime: 60_000,
    refetchInterval: 90_000,
  })
}

export function useExchangeRates() {
  return useQuery({
    queryKey: ['forex', 'rates'],
    queryFn: fetchExchangeRates,
    staleTime: 5 * 60_000,
    refetchInterval: 10 * 60_000,
  })
}
