import { useState, useEffect, useRef, useMemo, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, CartesianGrid, ComposedChart,
} from 'recharts'
import { WidgetShell } from '@/components/layout/WidgetShell'
import { useCryptoMarket, useExchangeRates } from '@/api/coingecko'
import {
  useBinanceOrderBook, useBinanceTrades,
  COINGECKO_TO_BINANCE,
} from '@/api/binance'
import { useBinanceTickerStore } from '@/store/binance.store'
import type { BinanceTrade, BinanceOrderBook } from '@/api/types/binance'
import { useAppStore } from '@/store/app.store'
import type { CryptoAsset } from '@/api/types/crypto'

const ACCENT = '#f59e0b'

type SortOrder = 'rank' | 'gain' | 'loss' | 'cap'
type RightTab = 'chart' | 'market' | 'forex' | 'trades' | 'depth'

// ─── Formatting helpers ──────────────────────────────────────────────────────

function formatPrice(price: number): string {
  if (price >= 1000) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  if (price >= 1)    return `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
  return `$${price.toLocaleString('en-US', { maximumFractionDigits: 4 })}`
}

function formatMarketCap(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`
  return `$${(n / 1e6).toFixed(0)}M`
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ChangeBadge({ pct }: { pct: number }) {
  const pos = pct >= 0
  return (
    <span
      className="text-[11px] font-mono px-1.5 py-0.5 rounded"
      style={{
        color: pos ? '#10b981' : '#f43f5e',
        background: pos ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)',
      }}
    >
      {pos ? '+' : ''}{pct.toFixed(2)}%
    </span>
  )
}

/** Displays the live Binance price and flashes green/red on change. Falls back to CoinGecko price. */
function LivePrice({
  livePrice,
  fallback,
  className = '',
}: {
  livePrice: number | undefined
  fallback: number
  className?: string
}) {
  const price = livePrice ?? fallback

  const prevRef = useRef(price)
  const [flash, setFlash] = useState<'up' | 'down' | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (livePrice == null) return
    if (prevRef.current !== livePrice) {
      const dir = livePrice > prevRef.current ? 'up' : 'down'
      prevRef.current = livePrice
      setFlash(dir)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setFlash(null), 500)
    }
  }, [livePrice])

  return (
    <span
      className={`font-mono transition-colors duration-300 ${className}`}
      style={{ color: flash === 'up' ? '#10b981' : flash === 'down' ? '#f43f5e' : undefined }}
    >
      {formatPrice(price)}
    </span>
  )
}

/** Depth chart built from order book bids / asks. */
function DepthChart({ book }: { book: BinanceOrderBook }) {
  const { chartData, bestBid, bestAsk, spread, spreadPct } = useMemo(() => {
    const topBids = book.bids.slice(0, 20)
    const topAsks = book.asks.slice(0, 20)
    const bestBid = topBids[0]?.price ?? 0
    const bestAsk = topAsks[0]?.price ?? 0
    const spread = bestAsk - bestBid
    const spreadPct = bestBid > 0 ? (spread / bestBid) * 100 : 0

    // Cumulative bids: sorted price ASC (far left = most depth)
    const bidPoints: { price: number; bid: number; ask?: undefined }[] = []
    let cumBid = 0
    for (let i = topBids.length - 1; i >= 0; i--) {
      cumBid += topBids[i].qty
      bidPoints.unshift({ price: topBids[i].price, bid: cumBid })
    }

    // Cumulative asks: sorted price ASC (center = least depth, far right = most)
    const askPoints: { price: number; ask: number; bid?: undefined }[] = []
    let cumAsk = 0
    for (const ask of topAsks) {
      cumAsk += ask.qty
      askPoints.push({ price: ask.price, ask: cumAsk })
    }

    return {
      chartData: [...bidPoints, ...askPoints],
      bestBid, bestAsk, spread, spreadPct,
    }
  }, [book])

  return (
    <div className="flex flex-col h-full min-h-0 gap-2">
      {/* Spread info */}
      <div className="flex items-center gap-3 flex-shrink-0 text-[11px]">
        <span className="text-emerald-400 font-mono">Bid {formatPrice(bestBid)}</span>
        <span className="text-white/30">
          Spread ${spread.toFixed(2)} · {spreadPct.toFixed(3)}%
        </span>
        <span className="text-rose-400 font-mono">Ask {formatPrice(bestAsk)}</span>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0" style={{ background: '#06080f', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 12, right: 12, left: -16, bottom: 8 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis
              dataKey="price"
              type="number"
              domain={['auto', 'auto']}
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
              axisLine={false} tickLine={false}
              tickFormatter={(v: number) => formatPrice(v)}
              tickCount={6}
            />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
              axisLine={false} tickLine={false}
            />
            <Tooltip
              contentStyle={{ background: 'rgba(13,17,23,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
              labelFormatter={(v) => `Preço: ${formatPrice(Number(v))}`}
              formatter={(v, name) => [Number(v).toFixed(4), name === 'bid' ? '📗 Bid vol' : '📕 Ask vol']}
            />
            <Area
              type="step" dataKey="bid"
              fill="rgba(16,185,129,0.15)" stroke="#10b981" strokeWidth={1.5}
              dot={false} connectNulls={false}
            />
            <Area
              type="step" dataKey="ask"
              fill="rgba(244,63,94,0.15)" stroke="#f43f5e" strokeWidth={1.5}
              dot={false} connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/** Scrolling real-time trade feed. */
function TradesFeed({ trades, coinSymbol }: { trades: BinanceTrade[]; coinSymbol: string }) {
  if (trades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-white/25">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
          className="w-2 h-2 rounded-full bg-amber-400"
        />
        <span className="text-xs">Conectando ao stream de {coinSymbol}…</span>
      </div>
    )
  }

  const buyVol  = trades.filter((t) => !t.buyerMaker).reduce((s, t) => s + t.value, 0)
  const sellVol = trades.filter((t) =>  t.buyerMaker).reduce((s, t) => s + t.value, 0)
  const totalVol = buyVol + sellVol
  const buyPct = totalVol > 0 ? (buyVol / totalVol) * 100 : 50

  return (
    <div className="flex flex-col h-full min-h-0 gap-1.5">
      {/* Buy / sell pressure bar */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-[11px] text-emerald-400 tabular-nums w-14">{buyPct.toFixed(1)}% buy</span>
        <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-rose-500/20">
          <motion.div
            className="h-full rounded-full bg-emerald-500"
            animate={{ width: `${buyPct}%` }}
            transition={{ type: 'spring', stiffness: 60, damping: 20 }}
          />
        </div>
        <span className="text-[11px] text-rose-400 tabular-nums w-14 text-right">{(100 - buyPct).toFixed(1)}% sell</span>
      </div>

      {/* Column header */}
      <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 px-2 py-1 text-[10px] text-white/25 uppercase tracking-widest flex-shrink-0">
        <span>Preço</span>
        <span className="text-right">Qtd</span>
        <span className="text-right w-16">Valor USD</span>
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
                <span className="text-right text-white/45">{trade.qty.toFixed(4)}</span>
                <span className="text-right text-white/35 w-16">${trade.value < 1000 ? trade.value.toFixed(0) : formatMarketCap(trade.value).slice(1)}</span>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}

/**
 * Memoized compact row — reads its own ticker from the global Binance store so
 * React.memo can bail out when only OTHER coins' tickers update.
 */
const CompactCoinRow = memo(function CompactCoinRow({
  coin,
  index,
}: {
  coin: CryptoAsset
  index: number
}) {
  const sym    = COINGECKO_TO_BINANCE[coin.id]
  const ticker = useBinanceTickerStore((s) => sym ? s.tickers[sym] : undefined)

  const price = ticker?.price ?? coin.price
  const prevRef = useRef(price)
  const [flash, setFlash] = useState<'up' | 'down' | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (ticker == null) return
    if (prevRef.current !== ticker.price) {
      const dir = ticker.price > prevRef.current ? 'up' : 'down'
      prevRef.current = ticker.price
      setFlash(dir)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setFlash(null), 500)
    }
  }, [ticker?.price, ticker])

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
        <span className="text-[10px] text-white/30 ml-1">#{coin.rank}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <ChangeBadge pct={coin.change24h} />
        <span
          className="text-xs font-mono transition-colors duration-300"
          style={{ color: flash === 'up' ? '#10b981' : flash === 'down' ? '#f43f5e' : 'rgba(255,255,255,0.75)' }}
        >
          {formatPrice(price)}
        </span>
      </div>
    </motion.div>
  )
})

// ─── Main widget ─────────────────────────────────────────────────────────────

export function CryptoWidget({ isFocused = false }: { isFocused?: boolean }) {
  const { cryptoIds } = useAppStore()

  const [sortOrder, setSortOrder] = useState<SortOrder>('rank')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [rightTab, setRightTab] = useState<RightTab>('chart')

  // ─── Data sources ────────────────────────────────────────────────────────
  const { data: coins, isLoading, error, refetch, dataUpdatedAt } = useCryptoMarket(cryptoIds)
  const { data: forex } = useExchangeRates()

  // Read from global store (BinanceTickerSync manages the WS connection)
  const allTickers     = useBinanceTickerStore((s) => s.tickers)
  const connectedCount = useBinanceTickerStore((s) => s.connectedCount)

  // Per-symbol on-demand streams (only opened when focused + tab selected)
  const orderBook = useBinanceOrderBook(
    isFocused && rightTab === 'depth' ? selectedId : null,
  )
  const trades = useBinanceTrades(
    isFocused && rightTab === 'trades' ? selectedId : null,
  )

  // ─── Derived values ──────────────────────────────────────────────────────
  const topGain  = coins?.reduce((a, b) => b.change24h > a.change24h ? b : a, coins[0])
  const topLoss  = coins?.reduce((a, b) => b.change24h < a.change24h ? b : a, coins[0])
  const totalVol = coins?.reduce((s, c) => s + c.volume24h, 0) ?? 0

  const sortedCoins = [...(coins ?? [])].sort((a, b) => {
    if (sortOrder === 'gain') return b.change24h - a.change24h
    if (sortOrder === 'loss') return a.change24h - b.change24h
    if (sortOrder === 'cap')  return b.marketCap - a.marketCap
    return a.rank - b.rank
  })

  const selectedCoin     = coins?.find((c) => c.id === selectedId) ?? null
  const totalMarketCap   = coins?.reduce((s, c) => s + c.marketCap, 0) ?? 1
  const selectedBinanceSym = selectedId ? COINGECKO_TO_BINANCE[selectedId] : null

  // Count live connections from store
  const liveCount = connectedCount

  const chartData = selectedCoin
    ? selectedCoin.sparkline.slice(-168).map((v, i) => ({ i, v }))
    : (coins ?? []).map((c) => ({ name: c.symbol, pct: parseFloat(c.change24h.toFixed(2)) }))

  // Tight Y domain: 2% padding around actual data range
  const chartDomain = useMemo<[number | string, number | string]>(() => {
    if (!selectedCoin) return ['auto', 'auto']
    const vals = selectedCoin.sparkline.slice(-168).filter(v => v > 0)
    if (!vals.length) return ['auto', 'auto']
    const min = Math.min(...vals)
    const max = Math.max(...vals)
    const pad = (max - min) * 0.1 || min * 0.01
    return [min - pad, max + pad]
  }, [selectedCoin])

  // Selected coin live price accessed inline from allTickers where needed

  // Tabs
  const tabs: { id: RightTab; label: string; requiresSelection?: boolean }[] = [
    { id: 'chart',  label: 'Gráfico' },
    { id: 'market', label: 'Mercado' },
    { id: 'forex',  label: 'Forex' },
    { id: 'trades', label: '⚡ Trades', requiresSelection: true },
    { id: 'depth',  label: '📊 Depth',  requiresSelection: true },
  ]

  return (
    <WidgetShell
      title="Mercado Cripto"
      icon={<span className={isFocused ? 'text-2xl' : 'text-base'}>₿</span>}
      isLoading={isLoading}
      error={error}
      onRetry={() => refetch()}
      lastUpdated={dataUpdatedAt || undefined}
      accentColor={ACCENT}
      isFocused={isFocused}
      fillHeight={isFocused}
      isLive={liveCount > 0}
      viewRoute="/crypto"
    >
      {/* ── Stats header ── */}
      {coins && coins.length > 0 && (
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
              {formatMarketCap(totalVol)}
            </span>
            <span className="text-[10px] text-white/20 mt-1 leading-none">total</span>
          </div>
        </div>
      )}

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
          {/* Left column: coin list */}
          <div className="w-full md:w-64 md:flex-shrink-0 flex flex-col md:min-h-0 min-h-[200px]">
            <div className="flex gap-1 mb-2 flex-shrink-0">
              {([
                { id: 'rank', label: 'Rank' },
                { id: 'gain', label: 'Alta↓' },
                { id: 'loss', label: 'Baixa↑' },
                { id: 'cap',  label: 'Cap↓' },
              ] as { id: SortOrder; label: string }[]).map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSortOrder(opt.id)}
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium transition-all"
                  style={{
                    background: sortOrder === opt.id ? 'rgba(255,255,255,0.08)' : 'transparent',
                    color: sortOrder === opt.id ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.28)',
                    border: `1px solid ${sortOrder === opt.id ? 'rgba(255,255,255,0.12)' : 'transparent'}`,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-0.5 overflow-y-auto flex-1 min-h-0 pr-0.5">
              {sortedCoins.map((coin, i) => {
                const isSelected = selectedId === coin.id
                const hasLive = COINGECKO_TO_BINANCE[coin.id] != null && allTickers[COINGECKO_TO_BINANCE[coin.id]] != null
                return (
                  <motion.div
                    key={coin.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.2) }}
                    onClick={() => {
                      setSelectedId(coin.id)
                      if (rightTab !== 'trades' && rightTab !== 'depth') setRightTab('chart')
                    }}
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
                        <span className="text-[10px] text-white/25">#{coin.rank}</span>
                      </div>
                      <div className="text-[10px] text-white/35 truncate">{coin.name}</div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <ChangeBadge pct={coin.change24h} />
                      <LivePrice livePrice={allTickers[COINGECKO_TO_BINANCE[coin.id] ?? '']?.price} fallback={coin.price} className="text-[11px] text-white/70 font-mono" />
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="md:w-px md:h-auto h-px w-full bg-white/6 flex-shrink-0" />

          {/* Right column: tabs + content */}
          <div className="flex-1 min-w-0 flex flex-col gap-3 min-h-[300px] md:min-h-0">
            <div className="flex gap-1 flex-shrink-0 flex-wrap">
              {tabs.map((tab) => {
                const disabled = tab.requiresSelection && !selectedId
                return (
                  <button
                    key={tab.id}
                    onClick={() => !disabled && setRightTab(tab.id)}
                    disabled={disabled}
                    className="px-3 py-1 rounded-lg text-xs font-medium transition-all disabled:opacity-30 disabled:cursor-default"
                    style={{
                      background: rightTab === tab.id ? ACCENT + '20' : 'transparent',
                      color: rightTab === tab.id ? ACCENT : 'rgba(255,255,255,0.35)',
                      border: `1px solid ${rightTab === tab.id ? ACCENT + '50' : 'transparent'}`,
                    }}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>

            <div className="flex-1 min-h-0 relative">
              {/* ── Tab: Gráfico ── */}
              <div style={{
                position: 'absolute', inset: 0,
                opacity: rightTab === 'chart' ? 1 : 0,
                pointerEvents: rightTab === 'chart' ? 'auto' : 'none',
                transition: 'opacity 0.2s ease',
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                {selectedCoin ? (
                  <>
                    <div className="flex items-baseline gap-2 flex-shrink-0">
                      <span className="text-sm font-semibold text-white/80">{selectedCoin.name}</span>
                      <LivePrice livePrice={selectedBinanceSym ? allTickers[selectedBinanceSym]?.price : undefined} fallback={selectedCoin.price} className="text-[13px] text-white/60" />
                      <ChangeBadge pct={selectedCoin.change7d} />
                      <span className="text-[11px] text-white/30 ml-1">7d</span>
                    </div>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: '#06080f', borderRadius: 10,
                        border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden',
                      }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData as { i: number; v: number }[]} margin={{ top: 16, right: 16, left: -20, bottom: 8 }}>
                            <defs>
                              <linearGradient id="cryptoAreaGrad2" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={ACCENT} stopOpacity={0.35} />
                                <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                            <XAxis dataKey="i" hide tickCount={7} />
                            <YAxis
                              domain={chartDomain}
                              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                              axisLine={false} tickLine={false}
                              tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toFixed(0)}`}
                            />
                            <Tooltip
                              contentStyle={{ background: 'rgba(13,17,23,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                              formatter={(v) => [formatPrice(Number(v)), selectedCoin.symbol]}
                              labelFormatter={() => ''}
                              labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                            />
                            <Area type="monotone" dataKey="v" stroke={ACCENT} strokeWidth={2} fill="url(#cryptoAreaGrad2)" dot={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ flex: 1, position: 'relative' }}>
                    <p className="text-[11px] text-white/35 uppercase tracking-widest mb-2">Variação 24h</p>
                    <div style={{
                      position: 'absolute', inset: 0, top: 24,
                      background: '#06080f', borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden',
                    }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={(coins ?? []).map((c) => ({ name: c.symbol, pct: parseFloat(c.change24h.toFixed(2)) }))}
                          margin={{ top: 16, right: 16, left: -16, bottom: 8 }}
                        >
                          <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                          <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                          <Tooltip
                            contentStyle={{ background: 'rgba(13,17,23,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                            formatter={(v) => [`${Number(v) > 0 ? '+' : ''}${v}%`, 'Variação']}
                            labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                          />
                          <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                            {(coins ?? []).map((c, idx) => (
                              <Cell key={idx} fill={c.change24h >= 0 ? '#10b981' : '#f43f5e'} fillOpacity={0.8} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Tab: Mercado ── */}
              <div style={{
                position: 'absolute', inset: 0,
                opacity: rightTab === 'market' ? 1 : 0,
                pointerEvents: rightTab === 'market' ? 'auto' : 'none',
                transition: 'opacity 0.2s ease',
                overflowY: 'auto',
              }}>
                <div className="flex flex-col gap-0.5">
                  {coins?.map((coin) => {
                    const barPct = Math.round((coin.marketCap / totalMarketCap) * 100)
                    return (
                      <div key={coin.id} className="px-3 py-2 rounded-lg hover:bg-white/4 transition-colors"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <img src={coin.imageUrl} alt={coin.name} className="w-5 h-5 rounded-full flex-shrink-0" />
                          <span className="text-[12px] font-semibold text-white/80">{coin.symbol}</span>
                          <span className="flex-1" />
                          <span className="text-[12px] font-mono text-white/55">{formatMarketCap(coin.marketCap)}</span>
                          <span className="text-[12px] font-mono text-white/40">{formatMarketCap(coin.volume24h)}</span>
                          <ChangeBadge pct={coin.change7d} />
                        </div>
                        <div className="h-0.5 rounded-full bg-white/6 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${barPct}%`, background: ACCENT, opacity: 0.5 }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* ── Tab: Forex ── */}
              <div style={{
                position: 'absolute', inset: 0,
                opacity: rightTab === 'forex' ? 1 : 0,
                pointerEvents: rightTab === 'forex' ? 'auto' : 'none',
                transition: 'opacity 0.2s ease',
              }}>
                {forex ? (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(forex.rates).map(([currency, rate]) => (
                      <div key={currency} className="flex flex-col justify-between px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] min-w-[80px]">
                        <span className="text-[10px] uppercase tracking-widest text-white/25 leading-none">{currency}</span>
                        <span className="text-[20px] font-mono font-bold text-white/85 leading-none mt-1.5">
                          {rate.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-white/20 mt-1 leading-none">por {forex.base}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-white/30">Dados forex indisponíveis.</p>
                )}
              </div>

              {/* ── Tab: ⚡ Trades ── */}
              <div style={{
                position: 'absolute', inset: 0,
                opacity: rightTab === 'trades' ? 1 : 0,
                pointerEvents: rightTab === 'trades' ? 'auto' : 'none',
                transition: 'opacity 0.2s ease',
                display: 'flex', flexDirection: 'column',
              }}>
                {selectedCoin ? (
                  <TradesFeed trades={trades} coinSymbol={selectedCoin.symbol} />
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-white/25">
                    Selecione uma moeda para ver o feed ao vivo
                  </div>
                )}
              </div>

              {/* ── Tab: 📊 Depth ── */}
              <div style={{
                position: 'absolute', inset: 0,
                opacity: rightTab === 'depth' ? 1 : 0,
                pointerEvents: rightTab === 'depth' ? 'auto' : 'none',
                transition: 'opacity 0.2s ease',
                display: 'flex', flexDirection: 'column',
              }}>
                {selectedCoin ? (
                  orderBook ? (
                    <DepthChart book={orderBook} />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-white/25">
                      <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ repeat: Infinity, duration: 1.2 }}
                        className="w-2 h-2 rounded-full bg-amber-400"
                      />
                      <span className="text-sm">Carregando order book de {selectedCoin.symbol}…</span>
                    </div>
                  )
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-white/25">
                    Selecione uma moeda para ver o order book
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
