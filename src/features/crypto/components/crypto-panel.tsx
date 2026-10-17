import { useId, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { SelectableRow } from '@/components/terminal/data-table'
import { PickerButton } from '@/components/terminal/picker-button'
import { QueryPanel } from '@/components/terminal/query-panel'
import { Stat, StatLine } from '@/components/terminal/stat-line'
import { StreamPanel } from '@/components/terminal/stream-panel'
import { tabPanelId, tabId } from '@/components/terminal/tab-ids'
import { Tabs } from '@/components/terminal/tabs'
import { EmptyState, ToneText } from '@/components/terminal/text'
import { TWO_PANE } from '@/components/terminal/grid'
import { BINANCE_STREAM, COINGECKO_TO_BINANCE } from '@/features/crypto/api/binance'
import { useCryptoMarket } from '@/features/crypto/api/coingecko'
import { formatUsdCompact, marketSummary, sortCoins, type CoinSort } from '@/features/crypto/lib/market-math'
import { useBinanceTickerStore } from '@/features/crypto/store/ticker-store'
import type { BinanceTicker, CryptoAsset } from '@/features/crypto/types'
import { useNow } from '@/hooks/use-now'
import { changeTone, formatAge, formatPrice, formatSigned } from '@/lib/terminal-format'
import { useAppStore } from '@/store/app-store'
import { useSourceHealthStore } from '@/store/source-health-store'
import { CoinChartView, DepthView, MarketView, TradesView } from './crypto-views'

type CryptoView = 'chart' | 'market' | 'trades' | 'depth'

const LIST_COLUMNS = '48px 34px minmax(0,1fr) 64px'
const SORTS: CoinSort[] = ['rank', 'gainers', 'losers', 'cap']
const VIEWS: CryptoView[] = ['chart', 'market', 'trades', 'depth']

/** REST rows with the live mini-ticker price and 24h change on top. */
function withLiveTickers(coins: CryptoAsset[], tickers: Record<string, BinanceTicker>): CryptoAsset[] {
  return coins.map((coin) => {
    const ticker = tickers[COINGECKO_TO_BINANCE[coin.id]]
    return ticker ? { ...coin, price: ticker.price, change24h: ((ticker.price - ticker.open) / ticker.open) * 100 } : coin
  })
}

function Change({ value, suffix = '' }: { value: number; suffix?: string }) {
  return <ToneText tone={changeTone(value)}>{formatSigned(value)}{suffix}</ToneText>
}

interface Selection {
  sort: CoinSort
  view: CryptoView
  coinId: string | null
  pickerOpen: boolean
}

const INITIAL_SELECTION: Selection = { sort: 'rank', view: 'chart', coinId: null, pickerOpen: false }

function CryptoBody({ restCoins, selection, onSelection }: { restCoins: CryptoAsset[]; selection: Selection; onSelection: (patch: Partial<Selection>) => void }) {
  const { t } = useTranslation()
  const listId = useId()
  const tabsId = useId()
  const tickers = useBinanceTickerStore((state) => state.tickers)
  const coins = useMemo(() => withLiveTickers(restCoins, tickers), [restCoins, tickers])
  const { sort, view, pickerOpen } = selection

  const byRank = sortCoins(coins, 'rank')
  const selected = coins.find((coin) => coin.id === selection.coinId) ?? byRank[0]
  if (!selected) {
    return <EmptyState title={t('terminal.markets.crypto.empty')} hint={t('terminal.markets.crypto.emptyHint')} />
  }
  const summary = marketSummary(coins)
  const views: Record<CryptoView, ReactNode> = {
    chart: <CoinChartView coin={selected} />,
    market: <MarketView coins={byRank} />,
    trades: <TradesView coin={selected} />,
    depth: <DepthView coin={selected} />,
  }

  return (
    <>
      <StatLine>
        <Stat label={t('terminal.markets.crypto.assets')}>{summary.count}</Stat>
        <Stat label={t('terminal.markets.crypto.topGainer')}>{summary.topGainer.symbol} <Change value={summary.topGainer.change24h} suffix="%" /></Stat>
        <Stat label={t('terminal.markets.crypto.topLoser')}>{summary.topLoser.symbol} <Change value={summary.topLoser.change24h} suffix="%" /></Stat>
        <Stat label={t('terminal.markets.crypto.volume')}>{formatUsdCompact(summary.volume24h)}</Stat>
        <Stat label={t('terminal.markets.crypto.rising')}>{summary.rising}/{summary.count}</Stat>
      </StatLine>

      <div className={TWO_PANE}>
        <div className="flex w-full sm:hidden">
          <PickerButton open={pickerOpen} onToggle={() => onSelection({ pickerOpen: !pickerOpen })} controls={listId}>
            {t('terminal.markets.crypto.picker', { symbol: selected.symbol, price: formatPrice(selected.price), count: coins.length })}
          </PickerButton>
        </div>

        <div id={listId} className={`min-w-0 max-w-[440px] flex-[1_1_320px] flex-col gap-[8px] ${pickerOpen ? 'flex' : 'flex max-sm:hidden'}`}>
          <Tabs
            variant="text"
            label={t('terminal.markets.crypto.sort.label')}
            value={sort}
            onChange={(id) => onSelection({ sort: id })}
            items={SORTS.map((id) => ({ id, label: t(`terminal.markets.crypto.sort.${id}`) }))}
          />
          <div className="grid gap-x-[10px] px-[8px] text-dim" style={{ gridTemplateColumns: LIST_COLUMNS }} aria-hidden>
            <span>{t('terminal.markets.crypto.columns.asset')}</span>
            <span>#</span>
            <span className="text-right">{t('terminal.markets.crypto.columns.price')}</span>
            <span className="text-right">{t('terminal.markets.crypto.columns.change')}</span>
          </div>
          <div className="flex flex-col">
            {sortCoins(coins, sort).map((coin) => (
              <SelectableRow
                key={coin.id}
                columns={LIST_COLUMNS}
                selected={coin.id === selected.id}
                onSelect={() => onSelection({ coinId: coin.id, pickerOpen: false })}
              >
                <span className="text-left">{coin.symbol}</span>
                <span className="text-left text-dim">#{coin.rank}</span>
                <span className="text-right">{formatPrice(coin.price)}</span>
                <span className="text-right"><Change value={coin.change24h} /></span>
              </SelectableRow>
            ))}
          </div>
        </div>

        <div className="flex min-w-0 flex-[3_1_520px] flex-col gap-[12px]">
          <div className="flex flex-wrap items-baseline gap-x-[16px] gap-y-[4px]">
            <span className="text-price font-semibold text-text">{formatPrice(selected.price)}</span>
            <Change value={selected.change24h} suffix="% 24h" />
            <span className="text-dim">{t('terminal.markets.crypto.pair', { symbol: selected.symbol, name: selected.name.toLowerCase(), rank: selected.rank })}</span>
          </div>
          <Tabs
            label={t('terminal.markets.crypto.views')}
            idBase={tabsId}
            value={view}
            onChange={(id) => onSelection({ view: id })}
            items={VIEWS.map((id) => ({ id, label: t(`terminal.markets.crypto.tabs.${id}`) }))}
          />
          <div role="tabpanel" id={tabPanelId(tabsId, view)} aria-labelledby={tabId(tabsId, view)} className="flex min-w-0 flex-col gap-[12px]">
            {views[view]}
          </div>
        </div>
      </div>
    </>
  )
}

/** [2.1] coin list with a detail pane: 7d chart, market caps, live trades and order book. */
export function CryptoPanel() {
  const { t } = useTranslation()
  const cryptoIds = useAppStore((state) => state.cryptoIds)
  const query = useCryptoMarket(cryptoIds)
  const stream = useSourceHealthStore((state) => state.streams[BINANCE_STREAM])
  const lastTickAt = useBinanceTickerStore((state) => Math.max(0, ...Object.values(state.tickers).map((ticker) => ticker.updatedAt)))
  const now = useNow(1_000)
  // Kept here so a failed refetch, which swaps the panel frame, does not reset the selection
  const [selection, setSelection] = useState(INITIAL_SELECTION)
  const onSelection = (patch: Partial<Selection>) => setSelection((current) => ({ ...current, ...patch }))
  const restSource = query.data?.[0]?.source === 'binance' ? 'binance rest' : 'coingecko'
  const panel = { id: '2.1', title: t('terminal.markets.crypto.title'), gap: 14 as const }

  if (query.data && !query.isError) {
    const lostAt = stream?.lostAt
    return (
      <StreamPanel
        {...panel}
        stream={stream}
        source={BINANCE_STREAM}
        meta={`${BINANCE_STREAM} · ${restSource} · ${formatAge(now - (lastTickAt || query.dataUpdatedAt))}`}
        frozenNote={lostAt ? t('terminal.panel.pricesFrozenAt', { time: new Date(lostAt).toTimeString().slice(0, 8) }) : undefined}
      >
        <CryptoBody restCoins={query.data} selection={selection} onSelection={onSelection} />
      </StreamPanel>
    )
  }

  return (
    <QueryPanel {...panel} query={query} source={restSource}>
      {(coins) => <CryptoBody restCoins={coins} selection={selection} onSelection={onSelection} />}
    </QueryPanel>
  )
}
