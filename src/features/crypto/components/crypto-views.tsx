import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DotChart } from '@/components/charts/dot-chart'
import { ChartLegend } from '@/components/terminal/chart-legend'
import { Cell, DataTable, TableRow } from '@/components/terminal/data-table'
import { BlockBar, EmptyState, ToneText } from '@/components/terminal/text'
import { useBinanceOrderBook, useBinanceTrades } from '@/features/crypto/api/binance'
import { cumulativeLevels, depthBar, formatTradeUsd, formatUsdCompact, largestLevel, percentileCap, tradeFlow, type BookLevel } from '@/features/crypto/lib/market-math'
import type { CryptoAsset } from '@/features/crypto/types'
import { useNow } from '@/hooks/use-now'
import { intlLocale } from '@/i18n'
import { changeTone, formatDayMonth, formatPrice, formatSigned } from '@/lib/terminal-format'

const HOUR_MS = 3_600_000
const WEEK_DAYS = 7
const CHART_SERIES_COLOR = '--color-warn'

export function CoinChartView({ coin }: { coin: CryptoAsset }) {
  const { t } = useTranslation()
  const [cursor, setCursor] = useState<number | null>(null)
  const now = useNow(60_000)
  const prices = coin.sparkline
  const series = useMemo(() => [{ data: prices, color: CHART_SERIES_COLOR, fill: true }], [prices])
  const xLabels = useMemo(
    () => Array.from({ length: WEEK_DAYS + 1 }, (_, index) => (index === WEEK_DAYS ? t('terminal.markets.now') : t('terminal.markets.daysAgo', { count: WEEK_DAYS - index }))),
    [t],
  )

  if (!prices.length) {
    return <EmptyState title={t('terminal.markets.chart.noHistory', { symbol: coin.symbol })} hint={t('terminal.markets.chart.noHistoryHint')} />
  }

  const last = prices[prices.length - 1]
  let readout: string | null = null
  if (cursor !== null && prices[cursor] !== undefined) {
    // CoinGecko's 7d sparkline is hourly and ends at the present
    const at = new Date(now - (prices.length - 1 - cursor) * HOUR_MS)
    const hour = `${String(at.getHours()).padStart(2, '0')}:00`
    readout = t('terminal.markets.chart.readout', { date: `${formatDayMonth(at, intlLocale())} ${hour}`, price: formatPrice(prices[cursor]), change: formatSigned((last / prices[cursor] - 1) * 100) })
  }

  return (
    <>
      <div className="flex flex-wrap justify-between gap-x-[16px] text-dim">
        <span>{t('terminal.markets.chart.caption', { symbol: coin.symbol })}</span>
        <span>{t('terminal.markets.chart.range', { min: formatPrice(Math.min(...prices)), max: formatPrice(Math.max(...prices)) })}</span>
      </div>
      <DotChart
        label={t('terminal.markets.chart.label', { symbol: coin.symbol })}
        series={series}
        format={formatPrice}
        xLabels={xLabels}
        padLeft={72}
        height="clamp(200px,32vw,300px)"
        onCursorChange={setCursor}
      />
      <ChartLegend readout={readout} />
    </>
  )
}

export function MarketView({ coins }: { coins: CryptoAsset[] }) {
  const { t } = useTranslation()
  const leader = coins.reduce<CryptoAsset | null>((top, coin) => (!top || coin.marketCap > top.marketCap ? coin : top), null)
  const maxCap = leader?.marketCap ?? 0
  const columns = t('terminal.markets.market.columns', { returnObjects: true })

  return (
    <>
      <DataTable
        columns="48px minmax(0,1fr) 64px 64px 64px"
        gap="2px 12px"
        header={[{ label: columns.asset }, { label: columns.bar }, { label: columns.cap, right: true }, { label: columns.volume, right: true }, { label: columns.change, right: true }]}
      >
        {coins.map((coin) => (
          <TableRow key={coin.id}>
            <Cell>{coin.symbol}</Cell>
            {/* Decision 2: the Binance fallback has no market cap, so no bar either */}
            <Cell truncate>{coin.marketCap > 0 ? <BlockBar value={coin.marketCap} max={maxCap} width={40} tone="land" /> : <ToneText tone="dim">—</ToneText>}</Cell>
            <Cell right>{coin.marketCap > 0 ? formatUsdCompact(coin.marketCap) : <ToneText tone="dim">—</ToneText>}</Cell>
            <Cell right className="text-dim">{formatUsdCompact(coin.volume24h)}</Cell>
            <Cell right><ToneText tone={changeTone(coin.change24h)}>{formatSigned(coin.change24h)}</ToneText></Cell>
          </TableRow>
        ))}
      </DataTable>
      <span className="text-dim">
        {leader && maxCap > 0
          ? t('terminal.markets.market.note', { symbol: leader.symbol, cap: formatUsdCompact(maxCap).slice(1) })
          : t('terminal.markets.market.noCap')}
      </span>
    </>
  )
}

const FLOW_BAR_WIDTH = 30
const TRADE_ROWS = 14

export function TradesView({ coin }: { coin: CryptoAsset }) {
  const { t } = useTranslation()
  const trades = useBinanceTrades(coin.id)
  const now = useNow(1_000)

  if (!trades.length) {
    return <EmptyState title={t('terminal.markets.trades.empty', { symbol: coin.symbol })} hint={t('terminal.markets.trades.emptyHint')} />
  }

  const flow = tradeFlow(trades, now)
  const buyCells = Math.round(flow.buyShare * FLOW_BAR_WIDTH)
  const columns = t('terminal.markets.trades.columns', { returnObjects: true })

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-[12px] gap-y-[4px]">
        <ToneText tone="ok">{t('terminal.markets.trades.buy', { share: (flow.buyShare * 100).toFixed(1) })}</ToneText>
        <span className="overflow-hidden whitespace-nowrap" aria-hidden>
          <ToneText tone="ok">{'█'.repeat(buyCells)}</ToneText><ToneText tone="err">{'█'.repeat(FLOW_BAR_WIDTH - buyCells)}</ToneText>
        </span>
        <ToneText tone="err">{t('terminal.markets.trades.sell', { share: ((1 - flow.buyShare) * 100).toFixed(1) })}</ToneText>
        <ToneText tone="dim">{t('terminal.markets.trades.window', { count: flow.count })}</ToneText>
      </div>
      <DataTable
        columns="auto auto minmax(0,1fr) auto auto"
        gap="2px 12px"
        header={[{ label: columns.time }, { label: columns.side }, { label: columns.price, right: true }, { label: columns.qty, right: true }, { label: columns.usd, right: true }]}
      >
        {trades.slice(0, TRADE_ROWS).map((trade) => {
          const at = new Date(trade.timestamp)
          const tone = trade.buyerMaker ? 'err' : 'ok'
          return (
            <TableRow key={trade.id}>
              <Cell className="text-dim">
                {at.toTimeString().slice(0, 8)}
                <span className="max-sm:hidden">.{String(at.getMilliseconds()).padStart(3, '0')}</span>
              </Cell>
              <Cell><ToneText tone={tone}>{t(`terminal.markets.trades.sides.${trade.buyerMaker ? 'sell' : 'buy'}`)}</ToneText></Cell>
              <Cell right><ToneText tone={tone}>{formatPrice(trade.price)}</ToneText></Cell>
              <Cell right>{trade.qty.toFixed(4)}</Cell>
              <Cell right>{formatTradeUsd(trade.value)}</Cell>
            </TableRow>
          )
        })}
      </DataTable>
    </>
  )
}

const BOOK_DEPTH = 10

// Order book levels sit one tick apart, so large prices keep their cents to stay distinguishable
const formatBookPrice = (price: number) => (price >= 1000 ? price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : formatPrice(price))
const formatBookQty = (qty: number) => (qty > 0 && qty < 0.001 ? '<0.001' : qty.toFixed(3))

function BookSide({ levels, cap, side, heading, qtyLabel, cumulativeLabel }: { levels: BookLevel[]; cap: number; side: 'bid' | 'ask'; heading: string; qtyLabel: string; cumulativeLabel: string }) {
  return (
    <DataTable columns="72px 60px minmax(0,1fr)" gap="2px 10px" header={[{ label: heading }, { label: qtyLabel, right: true }, { label: cumulativeLabel }]}>
      {levels.map((level) => {
        const { bar, clipped } = depthBar(level.cumulative, cap)
        return (
          <TableRow key={level.price}>
            <Cell><ToneText tone={side === 'bid' ? 'ok' : 'err'}>{formatBookPrice(level.price)}</ToneText></Cell>
            <Cell right>{formatBookQty(level.qty)}</Cell>
            <Cell truncate>
              <span className={side === 'bid' ? 'text-bid-bar' : 'text-ask-bar'}>{bar}</span>
              {clipped && <ToneText tone="warn">▸</ToneText>}
            </Cell>
          </TableRow>
        )
      })}
    </DataTable>
  )
}

export function DepthView({ coin }: { coin: CryptoAsset }) {
  const { t } = useTranslation()
  const book = useBinanceOrderBook(coin.id)

  if (!book?.bids.length || !book.asks.length) {
    return <EmptyState title={t('terminal.markets.depth.empty', { symbol: coin.symbol })} hint={t('terminal.markets.depth.emptyHint')} />
  }

  const bids = cumulativeLevels(book.bids, BOOK_DEPTH)
  const asks = cumulativeLevels(book.asks, BOOK_DEPTH)
  const cap = percentileCap([...bids, ...asks])
  const bestBid = bids[0].price
  const bestAsk = asks[0].price
  const wall = largestLevel(bids, asks)
  const columns = t('terminal.markets.depth.columns', { returnObjects: true })
  const quantity = (value: number) => value.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })

  return (
    <>
      <div className="flex flex-wrap gap-x-[24px] gap-y-[4px]">
        <span>{t('terminal.markets.depth.bid')} <ToneText tone="ok">{formatBookPrice(bestBid)}</ToneText></span>
        <span>{t('terminal.markets.depth.ask')} <ToneText tone="err">{formatBookPrice(bestAsk)}</ToneText></span>
        <ToneText tone="dim">{t('terminal.markets.depth.spread', { value: formatBookPrice(bestAsk - bestBid), percent: (((bestAsk - bestBid) / bestAsk) * 100).toFixed(4) })}</ToneText>
        <ToneText tone="dim">{t('terminal.markets.depth.cap', { cap: quantity(cap), symbol: coin.symbol })}</ToneText>
      </div>
      <div className="grid gap-x-[28px] gap-y-[12px]" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))' }}>
        <BookSide levels={bids} cap={cap} side="bid" heading={columns.bids} qtyLabel={columns.qty} cumulativeLabel={columns.cumulative} />
        <BookSide levels={asks} cap={cap} side="ask" heading={columns.asks} qtyLabel={columns.qty} cumulativeLabel={columns.cumulative} />
      </div>
      <span className="text-dim">
        {wall && `${t('terminal.markets.depth.wall', { qty: quantity(wall.qty), symbol: coin.symbol, level: wall.index + 1, side: t(`terminal.markets.depth.sides.${wall.side}`) })} · `}
        {t('terminal.markets.depth.clipNote')}
      </span>
    </>
  )
}
