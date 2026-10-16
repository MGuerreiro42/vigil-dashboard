import { formatMarketCap } from '@/features/crypto/lib/crypto-format'
import type { CryptoAsset } from '@/features/crypto/types'
import { StatTile } from '@/components/ui/stat-tile'

export function MarketStats({ coins }: { coins: CryptoAsset[] }) {
  const topGain = coins.reduce((best, coin) => (coin.change24h > best.change24h ? coin : best), coins[0])
  const topLoss = coins.reduce((worst, coin) => (coin.change24h < worst.change24h ? coin : worst), coins[0])
  const totalVolume = coins.reduce((total, coin) => total + coin.volume24h, 0)

  return (
    <div className="flex gap-2 mb-3 flex-shrink-0 overflow-x-auto pb-0.5">
      <StatTile label="Ativos" value={coins.length} caption="moedas" />
      {topGain && (
        <StatTile label="Maior Alta" value={`+${topGain.change24h.toFixed(2)}%`} caption={topGain.symbol} color="#10b981" className="min-w-[72px]" />
      )}
      {topLoss && (
        <StatTile label="Maior Queda" value={`${topLoss.change24h.toFixed(2)}%`} caption={topLoss.symbol} color="#f43f5e" className="min-w-[72px]" />
      )}
      <StatTile label="Vol. 24h" value={formatMarketCap(totalVolume)} caption="total" valueClassName="text-[16px] font-mono font-bold" />
    </div>
  )
}
