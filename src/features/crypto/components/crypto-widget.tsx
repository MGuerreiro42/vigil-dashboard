import { useState } from 'react'
import { motion } from 'framer-motion'
import { WidgetShell } from '@/components/layout/widget-shell'
import { SegmentedTabs, type TabOption } from '@/components/ui/segmented-tabs'
import { tabPanel } from '@/components/ui/tab-panel'
import { useCryptoMarket } from '@/features/crypto/api/coingecko'
import { useBinanceOrderBook, useBinanceTrades } from '@/features/crypto/api/binance'
import { useBinanceTickerStore } from '@/features/crypto/store/ticker-store'
import { useAppStore } from '@/store/app-store'
import { CompactCoinRow } from './compact-coin-row'
import { DepthChart } from './depth-chart'
import { TradesFeed } from './trades-feed'
import { CoinList } from './coin-list'
import { ForexRates } from './forex-rates'
import { MarketShareList } from './market-share-list'
import { MarketStats } from './market-stats'
import { PriceChart } from './price-chart'
import { ACCENT } from '@/features/crypto/lib/crypto-format'
import { useTranslation } from 'react-i18next'

type RightTab = 'chart' | 'market' | 'forex' | 'trades' | 'depth'

export function CryptoWidget({ isFocused = false }: { isFocused?: boolean }) {
  const { t } = useTranslation()
  const cryptoIds = useAppStore((state) => state.cryptoIds)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [rightTab, setRightTab] = useState<RightTab>('chart')

  const { data: coins, isLoading, error, refetch, dataUpdatedAt } = useCryptoMarket(cryptoIds)
  const connectedCount = useBinanceTickerStore((state) => state.connectedCount)

  // Per-symbol streams open only while their tab is visible in the focused view
  const orderBook = useBinanceOrderBook(isFocused && rightTab === 'depth' ? selectedId : null)
  const trades = useBinanceTrades(isFocused && rightTab === 'trades' ? selectedId : null)

  const selectedCoin = coins?.find((coin) => coin.id === selectedId) ?? null

  function handleSelectCoin(coinId: string) {
    setSelectedId(coinId)
    if (rightTab !== 'trades' && rightTab !== 'depth') setRightTab('chart')
  }

  const tabs: TabOption<RightTab>[] = [
    { id: 'chart',  label: t('crypto.tabs.chart') },
    { id: 'market', label: t('crypto.tabs.market') },
    { id: 'forex',  label: t('crypto.tabs.forex') },
    { id: 'trades', label: t('crypto.tabs.trades'), disabled: !selectedId },
    { id: 'depth',  label: t('crypto.tabs.depth'),  disabled: !selectedId },
  ]

  return (
    <WidgetShell
      title={t('crypto.title')}
      icon={<span className={isFocused ? 'text-2xl' : 'text-base'}>₿</span>}
      isLoading={isLoading}
      error={error}
      onRetry={() => refetch()}
      lastUpdated={dataUpdatedAt || undefined}
      accentColor={ACCENT}
      isFocused={isFocused}
      fillHeight={isFocused}
      isLive={connectedCount > 0}
      viewRoute="/markets"
    >
      {coins && coins.length > 0 && <MarketStats coins={coins} />}

      {/* ── COMPACT MODE ── */}
      {!isFocused && (
        <div className="flex flex-col gap-0.5">
          {coins?.map((coin, i) => (
            <CompactCoinRow
              key={coin.id}
              coin={coin}
              index={i}
            />
          ))}
        </div>
      )}

      {/* ── FOCUSED MODE ── */}
      {isFocused && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col md:flex-row gap-4 flex-1 min-h-0"
        >
          <CoinList coins={coins ?? []} selectedId={selectedId} onSelect={handleSelectCoin} />

          {/* Divider */}
          <div className="md:w-px md:h-auto h-px w-full bg-white/6 flex-shrink-0" />

          {/* Right column: tabs + content */}
          <div className="flex-1 min-w-0 flex flex-col gap-3 min-h-[300px] md:min-h-0">
            <SegmentedTabs tabs={tabs} active={rightTab} onChange={setRightTab} accent={ACCENT} />

            <div className="flex-1 min-h-0 relative">
              {/* ── Tab: Gráfico ── */}
              <div {...tabPanel(rightTab === 'chart', { display: 'flex', flexDirection: 'column', gap: 8 })}>
                <PriceChart coins={coins ?? []} selectedCoin={selectedCoin} />
              </div>

              {/* ── Tab: Mercado ── */}
              <div {...tabPanel(rightTab === 'market', { overflowY: 'auto' })}>
                <MarketShareList coins={coins ?? []} />
              </div>

              {/* ── Tab: Forex ── */}
              <div {...tabPanel(rightTab === 'forex')}>
                <ForexRates />
              </div>

              {/* ── Tab: ⚡ Trades ── */}
              <div {...tabPanel(rightTab === 'trades', { display: 'flex', flexDirection: 'column' })}>
                {selectedCoin ? (
                  <TradesFeed trades={trades} coinSymbol={selectedCoin.symbol} />
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-fg-subtle">
                    {t('crypto.selectForTrades')}
                  </div>
                )}
              </div>

              {/* ── Tab: 📊 Depth ── */}
              <div {...tabPanel(rightTab === 'depth', { display: 'flex', flexDirection: 'column' })}>
                {selectedCoin ? (
                  orderBook ? (
                    <DepthChart book={orderBook} />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-fg-subtle">
                      <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ repeat: Infinity, duration: 1.2 }}
                        className="w-2 h-2 rounded-full bg-amber-400"
                      />
                      <span className="text-sm">{t('crypto.loadingDepth', { symbol: selectedCoin.symbol })}</span>
                    </div>
                  )
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-fg-subtle">
                    {t('crypto.selectForDepth')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </WidgetShell>
  )
}
