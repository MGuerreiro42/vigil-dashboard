import { formatMarketCap } from '@/features/crypto/lib/crypto-format'
import type { CryptoAsset } from '@/features/crypto/types'

export function MarketStats({ coins }: { coins: CryptoAsset[] }) {
  const topGain = coins.reduce((best, coin) => (coin.change24h > best.change24h ? coin : best), coins[0])
  const topLoss = coins.reduce((worst, coin) => (coin.change24h < worst.change24h ? coin : worst), coins[0])
  const totalVolume = coins.reduce((total, coin) => total + coin.volume24h, 0)

  return (
    <div className="flex gap-2 mb-3 flex-shrink-0 overflow-x-auto pb-0.5">
      <div className="flex flex-col justify-between px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] min-w-[68px] flex-shrink-0">
        <span className="text-[10px] uppercase tracking-widest text-white/25 leading-none">Ativos</span>
        <span className="text-[22px] font-mono font-bold text-white/85 leading-none mt-1.5">{coins.length}</span>
        <span className="text-[10px] text-white/20 mt-1 leading-none">moedas</span>
      </div>
      {topGain && (
        <div className="flex flex-col justify-between px-3 py-2.5 rounded-xl border min-w-[72px] flex-shrink-0"
          style={{ background: 'rgba(16,185,129,0.07)', borderColor: 'rgba(16,185,129,0.25)' }}>
          <span className="text-[10px] uppercase tracking-widest leading-none text-emerald-400/60">Maior Alta</span>
          <span className="text-[22px] font-mono font-bold leading-none mt-1.5 text-emerald-400">
            +{topGain.change24h.toFixed(2)}%
          </span>
          <span className="text-[10px] mt-1 leading-none text-emerald-400/50">{topGain.symbol}</span>
        </div>
      )}
      {topLoss && (
        <div className="flex flex-col justify-between px-3 py-2.5 rounded-xl border min-w-[72px] flex-shrink-0"
          style={{ background: 'rgba(244,63,94,0.07)', borderColor: 'rgba(244,63,94,0.25)' }}>
          <span className="text-[10px] uppercase tracking-widest leading-none text-rose-400/60">Maior Queda</span>
          <span className="text-[22px] font-mono font-bold leading-none mt-1.5 text-rose-400">
            {topLoss.change24h.toFixed(2)}%
          </span>
          <span className="text-[10px] mt-1 leading-none text-rose-400/50">{topLoss.symbol}</span>
        </div>
      )}
      <div className="flex flex-col justify-between px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] min-w-[68px] flex-shrink-0">
        <span className="text-[10px] uppercase tracking-widest text-white/25 leading-none">Vol. 24h</span>
        <span className="text-[16px] font-mono font-bold text-white/85 leading-none mt-1.5">
          {formatMarketCap(totalVolume)}
        </span>
        <span className="text-[10px] text-white/20 mt-1 leading-none">total</span>
      </div>
    </div>
  )
}
