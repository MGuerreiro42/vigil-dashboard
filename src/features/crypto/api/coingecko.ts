import { useQuery } from '@tanstack/react-query'
import { fetchOk } from '@/lib/http'
import { queryKeys } from '@/lib/query-keys'
import { COINGECKO_TO_BINANCE } from '@/features/crypto/api/binance'
import type { CryptoAsset } from '@/features/crypto/types'

const BASE = 'https://api.coingecko.com/api/v3'

type RawCoin = {
  id: string
  symbol?: string
  name?: string
  current_price?: number
  market_cap?: number
  total_volume?: number
  price_change_percentage_24h?: number
  price_change_percentage_7d_in_currency?: number
  sparkline_in_7d?: { price?: number[] }
  market_cap_rank?: number
  image?: string
}

function normalizeCoin(raw: RawCoin): CryptoAsset {
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
    source: 'coingecko',
  }
}

type RawBinanceTicker = { symbol: string; lastPrice: string; priceChangePercent: string; quoteVolume: string }

/** Binance 24h tickers shaped like CoinGecko rows: no market cap, logo, 7d change or sparkline. */
export function binanceTickersToAssets(ids: string[], tickers: RawBinanceTicker[]): CryptoAsset[] {
  const bySymbol = new Map(tickers.map((ticker) => [ticker.symbol.toLowerCase(), ticker]))
  return ids.flatMap((id, index) => {
    const ticker = bySymbol.get(COINGECKO_TO_BINANCE[id])
    if (!ticker) return []
    return [{
      id,
      symbol: ticker.symbol.replace(/USDT$/, ''),
      name: id.replace(/-\d+$/, '').replace(/^\w/, (letter) => letter.toUpperCase()),
      price: Number(ticker.lastPrice),
      marketCap: 0,
      volume24h: Number(ticker.quoteVolume),
      change24h: Number(ticker.priceChangePercent),
      change7d: 0,
      sparkline: [],
      rank: index + 1,
      imageUrl: '',
      source: 'binance' as const,
    }]
  })
}

async function fetchFromCoinGecko(ids: string[], signal: AbortSignal): Promise<CryptoAsset[]> {
  const params = new URLSearchParams({
    vs_currency: 'usd',
    ids: ids.join(','),
    sparkline: 'true',
    price_change_percentage: '24h,7d',
    order: 'market_cap_desc',
  })
  const response = await fetchOk(`${BASE}/coins/markets?${params}`, 'CoinGecko', { signal })
  return ((await response.json()) as RawCoin[]).map(normalizeCoin)
}

async function fetchFromBinance(ids: string[], signal: AbortSignal): Promise<CryptoAsset[]> {
  const symbols = ids.map((id) => COINGECKO_TO_BINANCE[id]?.toUpperCase()).filter(Boolean)
  const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(symbols))}&type=MINI`
  const response = await fetchOk(url, 'Binance', { signal })
  return binanceTickersToAssets(ids, await response.json())
}

/** CoinGecko market data, falling back to Binance 24h tickers when CoinGecko is down or rate-limited. */
async function fetchCryptoMarket(ids: string[], signal: AbortSignal): Promise<CryptoAsset[]> {
  try {
    return await fetchFromCoinGecko(ids, signal)
  } catch (error) {
    if (signal.aborted) throw error
    return fetchFromBinance(ids, signal)
  }
}

export function useCryptoMarket(ids: string[]) {
  return useQuery({
    queryKey: queryKeys.crypto.market(ids),
    queryFn: ({ signal }) => fetchCryptoMarket(ids, signal),
    staleTime: 60_000,
    refetchInterval: 90_000,
  })
}
