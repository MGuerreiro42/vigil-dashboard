import { motion, AnimatePresence } from 'framer-motion'
import type { BinanceTrade } from '@/features/crypto/types'
import { USD_COMPACT, formatPrice } from '@/features/crypto/lib/crypto-format'
import { useTranslation } from 'react-i18next'

export function TradesFeed({ trades, coinSymbol }: { trades: BinanceTrade[]; coinSymbol: string }) {
  const { t } = useTranslation()
  if (trades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-fg-subtle">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
          className="w-2 h-2 rounded-full bg-amber-400"
        />
        <span className="text-xs">{t('crypto.connectingTrades', { symbol: coinSymbol })}</span>
      </div>
    )
  }

  const buyVol  = trades.filter((trade) => !trade.buyerMaker).reduce((total, trade) => total + trade.value, 0)
  const sellVol = trades.filter((trade) =>  trade.buyerMaker).reduce((total, trade) => total + trade.value, 0)
  const totalVol = buyVol + sellVol
  const buyPct = totalVol > 0 ? (buyVol / totalVol) * 100 : 50

  return (
    <div className="flex flex-col h-full min-h-0 gap-1.5">
      {/* Buy / sell pressure bar */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-[11px] text-emerald-400 tabular-nums w-14">{t('crypto.trades.buy', { percent: buyPct.toFixed(1) })}</span>
        <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-rose-500/20">
          <motion.div
            className="h-full rounded-full bg-emerald-500"
            animate={{ width: `${buyPct}%` }}
            transition={{ type: 'spring', stiffness: 60, damping: 20 }}
          />
        </div>
        <span className="text-[11px] text-rose-400 tabular-nums w-14 text-right">{t('crypto.trades.sell', { percent: (100 - buyPct).toFixed(1) })}</span>
      </div>

      {/* Column header */}
      <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 px-2 py-1 text-[10px] text-fg-subtle uppercase tracking-widest flex-shrink-0">
        <span>{t('crypto.trades.price')}</span>
        <span className="text-right">{t('crypto.trades.quantity')}</span>
        <span className="text-right w-16">{t('crypto.trades.value')}</span>
      </div>

      {/* Trades */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <AnimatePresence initial={false}>
          {trades.map((trade) => {
            const isBuy = !trade.buyerMaker
            return (
              <motion.div
                key={trade.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="grid grid-cols-[1fr_auto_auto] gap-x-3 px-2 py-[3px] rounded text-[12px] font-mono flex-shrink-0"
                style={{ background: isBuy ? 'rgba(16,185,129,0.04)' : 'rgba(244,63,94,0.04)' }}
              >
                <span style={{ color: isBuy ? '#10b981' : '#f43f5e' }}>
                  {formatPrice(trade.price)}
                </span>
                <span className="text-right text-fg-muted">{trade.qty.toFixed(4)}</span>
                <span className="text-right text-fg-muted w-16">{USD_COMPACT.format(trade.value)}</span>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
