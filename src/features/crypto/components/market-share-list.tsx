import { ACCENT, formatMarketCap } from '@/features/crypto/lib/crypto-format'
import type { CryptoAsset } from '@/features/crypto/types'
import { ChangeBadge } from './change-badge'
import { CoinIcon } from './coin-icon'

export function MarketShareList({ coins }: { coins: CryptoAsset[] }) {
  const totalMarketCap = coins.reduce((total, coin) => total + coin.marketCap, 0) || 1

  return (
    <div className="flex flex-col gap-0.5">
      {coins.map((coin) => {
        const barPct = Math.round((coin.marketCap / totalMarketCap) * 100)
        return (
          <div key={coin.id} className="px-3 py-2 rounded-lg hover:bg-white/4 transition-colors"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="flex items-center gap-2 mb-1.5">
              <CoinIcon coin={coin} size={20} />
              <span className="text-[12px] font-semibold text-white/80">{coin.symbol}</span>
              <span className="flex-1" />
              <span className="text-[12px] font-mono text-white/55">{formatMarketCap(coin.marketCap)}</span>
              <span className="text-[12px] font-mono text-fg-muted">{formatMarketCap(coin.volume24h)}</span>
              <ChangeBadge pct={coin.change7d} />
            </div>
            <div className="h-0.5 rounded-full bg-white/6 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${barPct}%`, background: ACCENT, opacity: 0.5 }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
