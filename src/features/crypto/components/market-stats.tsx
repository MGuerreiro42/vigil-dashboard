import { formatMarketCap } from '@/features/crypto/lib/crypto-format'
import type { CryptoAsset } from '@/features/crypto/types'
import { StatTile } from '@/components/ui/stat-tile'
import { useTranslation } from 'react-i18next'

export function MarketStats({ coins }: { coins: CryptoAsset[] }) {
  const { t } = useTranslation()
  const topGain = coins.reduce((best, coin) => (coin.change24h > best.change24h ? coin : best), coins[0])
  const topLoss = coins.reduce((worst, coin) => (coin.change24h < worst.change24h ? coin : worst), coins[0])
  const totalVolume = coins.reduce((total, coin) => total + coin.volume24h, 0)

  return (
    <div className="grid grid-cols-2 sm:flex gap-2 mb-3 flex-shrink-0">
      <StatTile label={t('crypto.stats.assets')} value={coins.length} caption={t('crypto.stats.coins')} />
      {topGain && (
        <StatTile label={t('crypto.stats.topGain')} value={`+${topGain.change24h.toFixed(2)}%`} caption={topGain.symbol} color="#10b981" className="min-w-[72px]" />
      )}
      {topLoss && (
        <StatTile label={t('crypto.stats.topLoss')} value={`${topLoss.change24h.toFixed(2)}%`} caption={topLoss.symbol} color="#f43f5e" className="min-w-[72px]" />
      )}
      <StatTile label={t('crypto.stats.volume')} value={formatMarketCap(totalVolume)} caption={t('common.total')} valueClassName="text-[16px] font-mono font-bold" />
    </div>
  )
}
