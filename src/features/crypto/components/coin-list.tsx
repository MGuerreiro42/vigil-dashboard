import { useState } from 'react'
import { motion } from 'framer-motion'
import { useShallow } from 'zustand/react/shallow'
import { COINGECKO_TO_BINANCE } from '@/features/crypto/api/binance'
import { useBinanceTickerStore } from '@/features/crypto/store/ticker-store'
import { ACCENT } from '@/features/crypto/lib/crypto-format'
import type { CryptoAsset } from '@/features/crypto/types'
import { ChangeBadge } from './change-badge'
import { LivePrice } from './live-price'
import { useTranslation } from 'react-i18next'

type SortOrder = 'rank' | 'gain' | 'loss' | 'cap'

const SORT_OPTIONS: SortOrder[] = ['rank', 'gain', 'loss', 'cap']

function compareCoins(order: SortOrder) {
  return (first: CryptoAsset, second: CryptoAsset) => {
    if (order === 'gain') return second.change24h - first.change24h
    if (order === 'loss') return first.change24h - second.change24h
    if (order === 'cap')  return second.marketCap - first.marketCap
    return first.rank - second.rank
  }
}

export function CoinList({ coins, selectedId, onSelect }: {
  coins: CryptoAsset[]
  selectedId: string | null
  onSelect: (coinId: string) => void
}) {
  const { t } = useTranslation()
  const [sortOrder, setSortOrder] = useState<SortOrder>('rank')
  // Symbols only: re-renders when a coin goes live, not on every price tick
  const liveSymbols = useBinanceTickerStore(useShallow((state) => Object.keys(state.tickers)))
  const sortedCoins = [...coins].sort(compareCoins(sortOrder))

  return (
    <div className="w-full md:w-64 md:flex-shrink-0 flex flex-col md:min-h-0 min-h-[200px]">
      <div className="flex gap-1 mb-2 flex-shrink-0">
        {SORT_OPTIONS.map((option) => (
          <button
            key={option}
            onClick={() => setSortOrder(option)}
            className="px-2.5 py-1 rounded-md text-[11px] font-medium transition-all"
            style={{
              background: sortOrder === option ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: sortOrder === option ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.5)',
              border: `1px solid ${sortOrder === option ? 'rgba(255,255,255,0.12)' : 'transparent'}`,
            }}
          >
            {t(`crypto.sort.${option}`)}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-0.5 overflow-y-auto flex-1 min-h-0 pr-0.5">
        {sortedCoins.map((coin, i) => {
          const isSelected = selectedId === coin.id
          const hasLive = liveSymbols.includes(COINGECKO_TO_BINANCE[coin.id])
          return (
            <motion.div
              key={coin.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.2) }}
              onClick={() => onSelect(coin.id)}
              className="flex items-center gap-2 py-1.5 px-2 rounded-lg transition-colors cursor-pointer hover:bg-white/4 flex-shrink-0"
              style={{
                background: isSelected ? ACCENT + '14' : undefined,
                outline: isSelected ? `1px solid ${ACCENT}38` : 'none',
              }}
            >
              <div className="relative flex-shrink-0">
                <img src={coin.imageUrl} alt={coin.name} className="w-7 h-7 rounded-full" />
                {hasLive && (
                  <motion.div
                    className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-black"
                    style={{ background: '#10b981' }}
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-[12px] font-semibold text-white/85">{coin.symbol}</span>
                  <span className="text-[10px] text-fg-subtle">#{coin.rank}</span>
                </div>
                <div className="text-[10px] text-fg-muted truncate">{coin.name}</div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <ChangeBadge pct={coin.change24h} />
                <LivePrice coin={coin} className="text-[11px] text-white/70" />
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
