import { memo } from 'react'
import { motion } from 'framer-motion'
import type { CryptoAsset } from '@/features/crypto/types'
import { ChangeBadge } from './change-badge'
import { LivePrice } from './live-price'

export const CompactCoinRow = memo(function CompactCoinRow({
  coin,
  index,
}: {
  coin: CryptoAsset
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 300, damping: 30 }}
      className="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-white/4 transition-colors"
    >
      <img src={coin.imageUrl} alt={coin.name} className="w-6 h-6 rounded-full flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-xs font-semibold text-white/85">{coin.symbol}</span>
        <span className="text-[10px] text-fg-subtle ml-1">#{coin.rank}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <ChangeBadge pct={coin.change24h} />
        <LivePrice coin={coin} className="text-xs" idleColor="rgba(255,255,255,0.75)" />
      </div>
    </motion.div>
  )
})
