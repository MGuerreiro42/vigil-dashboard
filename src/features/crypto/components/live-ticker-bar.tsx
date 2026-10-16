import { memo } from 'react'
import { useBinanceTickerStore } from '@/features/crypto/store/ticker-store'
import { COINGECKO_TO_BINANCE } from '@/features/crypto/api/binance'
import { usePriceFlash, flashColor } from '@/features/crypto/hooks/use-price-flash'
import type { CryptoAsset } from '@/features/crypto/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTickerPrice(price: number): string {
  if (price >= 10000) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  if (price >= 1)     return `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
  return `$${price.toLocaleString('en-US', { maximumFractionDigits: 4 })}`
}

// ─── Single coin item ─────────────────────────────────────────────────────────

const TickerItem = memo(function TickerItem({ coin }: { coin: CryptoAsset }) {
  const symbol = COINGECKO_TO_BINANCE[coin.id]
  const ticker = useBinanceTickerStore((state) => (symbol ? state.tickers[symbol] : undefined))

  const livePrice = ticker?.price ?? coin.price
  const pct       = ticker
    ? ((ticker.price - ticker.open) / ticker.open) * 100
    : coin.change24h
  const isUp = pct >= 0

  const flash = usePriceFlash(ticker?.price)

  return (
    <div className="flex items-center gap-2 px-5 flex-shrink-0 select-none">
      <img src={coin.imageUrl} alt={coin.symbol} className="w-4 h-4 rounded-full flex-shrink-0" />
      <span className="text-[12px] font-semibold text-white/55 tracking-wide">{coin.symbol}</span>
      <span
        className="text-[12px] font-mono font-bold tabular-nums transition-colors duration-200"
        style={{ color: flashColor(flash, 'rgba(255,255,255,0.88)') }}
      >
        {formatTickerPrice(livePrice)}
      </span>
      <span
        className="text-[11px] font-mono tabular-nums"
        style={{ color: isUp ? '#10b981' : '#f43f5e' }}
      >
        {isUp ? '▲' : '▼'} {Math.abs(pct).toFixed(2)}%
      </span>
      {/* Divider */}
      <div className="w-px h-3 bg-white/10 ml-1 flex-shrink-0" />
    </div>
  )
})

// ─── Ticker bar ───────────────────────────────────────────────────────────────

// CSS injected once — avoids Tailwind arbitrary animation limitations
const TICKER_CSS = `
@keyframes ticker-scroll {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.ticker-track {
  animation: ticker-scroll 55s linear infinite;
  will-change: transform;
}
.ticker-track:hover {
  animation-play-state: paused;
}
`

interface Props {
  coins: CryptoAsset[]
}

export function LiveTickerBar({ coins }: Props) {
  const connectedCount = useBinanceTickerStore((state) => state.connectedCount)
  const isLive = connectedCount > 0

  if (!coins || coins.length === 0) return null

  return (
    <>
      <style>{TICKER_CSS}</style>
      <div
        className="flex-shrink-0 overflow-hidden relative"
        style={{
          height: 40,
          background: 'rgba(8, 11, 18, 0.8)',
          borderTop:    '1px solid rgba(255,255,255,0.05)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          backdropFilter: 'blur(8px)',
        }}
      >
        {/* Left gradient fade */}
        <div
          className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, rgba(8,11,18,0.95) 0%, transparent 100%)',
          }}
        />

        {/* Right gradient fade */}
        <div
          className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(270deg, rgba(8,11,18,0.95) 0%, transparent 100%)',
          }}
        />

        {/* Live badge — fixed left */}
        <div
          className="absolute left-0 top-0 bottom-0 z-20 flex items-center gap-2 pl-5 pr-6"
          style={{
            background: 'linear-gradient(90deg, rgba(8,11,18,1) 70%, transparent 100%)',
          }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{
              background: isLive ? '#10b981' : '#8b93a1',
              boxShadow:  isLive ? '0 0 6px #10b981' : 'none',
              animation:  isLive ? 'ticker-pulse 1.4s ease-in-out infinite' : 'none',
            }}
          />
          <span
            className="text-[10px] font-bold tracking-widest uppercase"
            style={{ color: isLive ? '#10b981' : 'rgba(255,255,255,0.25)' }}
          >
            LIVE
          </span>
          <div className="w-px h-4 bg-white/10 ml-1" />
        </div>

        {/* Scrolling track — duplicated for seamless loop */}
        <div className="ticker-track flex items-center h-full pl-28">
          {[...coins, ...coins].map((coin, i) => (
            <TickerItem key={`${coin.id}-${i}`} coin={coin} />
          ))}
        </div>
      </div>

      {/* Glow pulse keyframe */}
      <style>{`
        @keyframes ticker-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>
    </>
  )
}
