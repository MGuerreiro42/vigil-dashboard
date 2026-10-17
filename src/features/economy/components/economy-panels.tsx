import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { DotChart } from '@/components/charts/dot-chart'
import { ChartLegend } from '@/components/terminal/chart-legend'
import { combineQueries } from '@/components/terminal/panel-state'
import { QueryPanel } from '@/components/terminal/query-panel'
import { ToneText } from '@/components/terminal/text'
import { formatUsdCompact } from '@/features/crypto/lib/market-math'
import { useBcbSeries } from '@/features/economy/api/bcb'
import { useBitcoinFees, useCryptoGlobal, useFearGreed } from '@/features/economy/api/crypto-pulse'
import { FX_CURRENCIES, useFxHistory, useFxLatest } from '@/features/economy/api/frankfurter'
import { fearGreedBand, fearGreedGauge, fearGreedTone, formatBrazil, formatDecimal, paddedRange, percentChange, realRate } from '@/features/economy/lib/economy-format'
import type { SeriesPoint } from '@/features/economy/types'
import { intlLocale } from '@/i18n'
import { changeTone, formatDayMonth, formatMonthYear, formatShortDate, formatSigned, parseIsoDay } from '@/lib/terminal-format'

const KEY_VALUE_COLUMNS = '110px minmax(0,1fr)'

function KeyValues({ children }: { children: ReactNode }) {
  return <div className="grid gap-x-[12px] gap-y-[2px]" style={{ gridTemplateColumns: KEY_VALUE_COLUMNS }}>{children}</div>
}

function KeyValue({ label, children }: { label: string; children: ReactNode }) {
  return <><span className="text-dim">{label}</span><span className="min-w-0">{children}</span></>
}

function ChartCaption({ left, right }: { left: ReactNode; right: ReactNode }) {
  return <div className="flex flex-wrap justify-between gap-x-[16px] text-dim"><span>{left}</span>{right}</div>
}

/** Evenly spaced relative labels: −90d, −60d, −30d, agora. */
function useRelativeDayLabels(days: number[]) {
  const { t } = useTranslation()
  return useMemo(() => [...days.map((count) => t('terminal.markets.daysAgo', { count })), t('terminal.markets.now')], [t, days])
}

const FX_DAYS = [90, 60, 30]
// JPY trades in whole yen, so two decimals are enough
const fxDigits = (currency: string) => (currency === 'JPY' ? 2 : 4)
const formatFxAxis = (value: number) => formatBrazil(value, 3)

function FxHistory({ points }: { points: SeriesPoint[] }) {
  const { t } = useTranslation()
  const [cursor, setCursor] = useState<number | null>(null)
  const values = useMemo(() => points.map((point) => point.value), [points])
  const series = useMemo(() => [{ data: values, color: '--color-ok', fill: true }], [values])
  const xLabels = useRelativeDayLabels(FX_DAYS)
  const change = percentChange(values[0], values[values.length - 1])
  const point = cursor === null ? null : points[cursor]

  return (
    <>
      <ChartCaption left={t('terminal.markets.fx.history')} right={<ToneText tone={changeTone(change)}>{formatSigned(change)}%</ToneText>} />
      <DotChart label={t('terminal.markets.fx.chartLabel')} series={series} format={formatFxAxis} xLabels={xLabels} height="170px" onCursorChange={setCursor} />
      <ChartLegend readout={point && t('terminal.markets.fx.readout', { date: formatDayMonth(parseIsoDay(point.date), intlLocale()), value: formatBrazil(point.value, 4) })} />
    </>
  )
}

/** [2.2] USD against five currencies and the 90-day USD/BRL line. */
export function FxPanel() {
  const { t } = useTranslation()
  const latest = useFxLatest()
  const history = useFxHistory('BRL', 90)
  const locale = intlLocale()
  const date = latest.data ? ` · ${formatShortDate(parseIsoDay(latest.data.date), locale)}` : ''

  return (
    <QueryPanel id="2.2" title={t('terminal.markets.fx.title')} meta={`bce · frankfurter${date}`} query={latest} source="frankfurter">
      {(snapshot) => (
        <>
          <div className="grid gap-x-[16px] gap-y-[2px]" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(130px, 100%), 1fr))' }}>
            {FX_CURRENCIES.filter((currency) => snapshot.rates[currency] !== undefined).map((currency) => (
              <span key={currency}>
                <span className="text-dim">USD/{currency}</span>{' '}
                {currency === 'BRL' ? formatBrazil(snapshot.rates[currency], 4) : formatDecimal(snapshot.rates[currency], fxDigits(currency), locale)}
              </span>
            ))}
          </div>
          {history.data && history.data.length > 1
            ? <FxHistory points={history.data} />
            : <span className="text-dim">{t(history.isError ? 'terminal.markets.fx.historyFailed' : 'terminal.markets.fx.historyWaiting')}</span>}
        </>
      )}
    </QueryPanel>
  )
}

const IPCA_MONTHS = 13
const formatPercentAxis = (value: number) => `${formatBrazil(value, 1)}%`

function IpcaTrend({ points }: { points: SeriesPoint[] }) {
  const { t } = useTranslation()
  const [cursor, setCursor] = useState<number | null>(null)
  const locale = intlLocale()
  const values = useMemo(() => points.map((point) => point.value), [points])
  const series = useMemo(() => [{ data: values, color: '--color-warn' }], [values])
  const [min, max] = paddedRange(values, 0.2)
  const xLabels = useMemo(() => {
    const label = (index: number) => formatMonthYear(parseIsoDay(points[index].date), locale, true)
    const middle = Math.round((points.length - 1) / 2)
    return points.map((_, index) => (index === 0 || index === middle || index === points.length - 1 ? label(index) : ''))
  }, [points, locale])
  const point = cursor === null ? null : points[cursor]

  return (
    <>
      <ChartCaption left={t('terminal.markets.rates.trend', { count: points.length })} right={<span>{t('terminal.markets.rates.target')}</span>} />
      <DotChart label={t('terminal.markets.rates.chartLabel')} series={series} min={min} max={max} format={formatPercentAxis} xLabels={xLabels} height="150px" onCursorChange={setCursor} />
      <ChartLegend readout={point && t('terminal.markets.rates.readout', { month: formatMonthYear(parseIsoDay(point.date), locale, true), value: formatBrazil(point.value, 2) })} />
    </>
  )
}

const lastOf = (points: SeriesPoint[]) => points[points.length - 1]

/** [2.3] Selic, IPCA and the real rate from Banco Central's SGS series. */
export function RatesPanel() {
  const { t } = useTranslation()
  const query = combineQueries(useBcbSeries('selic'), useBcbSeries('ipca12m'), useBcbSeries('ipcaMonthly'))
  const locale = intlLocale()

  return (
    <QueryPanel id="2.3" title={t('terminal.markets.rates.title')} meta="bcb · sgs" query={query} source="bcb · sgs">
      {([selicPoints, ipca12mPoints, ipcaMonthlyPoints]) => {
        const selic = lastOf(selicPoints)
        const ipca12m = lastOf(ipca12mPoints)
        const ipcaMonthly = lastOf(ipcaMonthlyPoints)
        if (!selic || !ipca12m || !ipcaMonthly) return <span className="text-dim">{t('terminal.markets.rates.empty')}</span>
        const real = realRate(selic.value, ipca12m.value)
        const month = (point: SeriesPoint) => formatMonthYear(parseIsoDay(point.date), locale)
        return (
          <>
            <KeyValues>
              <KeyValue label={t('terminal.markets.rates.selic')}><ToneText tone="warn">{formatBrazil(selic.value, 2)}%</ToneText> <ToneText tone="dim">{t('terminal.markets.rates.selicNote')}</ToneText></KeyValue>
              <KeyValue label={t('terminal.markets.rates.ipca12m')}>{formatBrazil(ipca12m.value, 2)}% <ToneText tone="dim">{month(ipca12m)}</ToneText></KeyValue>
              <KeyValue label={t('terminal.markets.rates.ipcaMonth')}>{formatBrazil(ipcaMonthly.value, 2)}% <ToneText tone="dim">{month(ipcaMonthly)}</ToneText></KeyValue>
              <KeyValue label={t('terminal.markets.rates.realRate')}><ToneText tone={changeTone(real)}>{formatBrazil(real, 2)}%</ToneText> <ToneText tone="dim">{t('terminal.markets.rates.realRateNote')}</ToneText></KeyValue>
            </KeyValues>
            {ipca12mPoints.length > 1 && <IpcaTrend points={ipca12mPoints.slice(-IPCA_MONTHS)} />}
          </>
        )
      }}
    </QueryPanel>
  )
}

const FEAR_GREED_DAYS = [30, 20, 10]
const NEUTRAL = 50

function FearGreedTrend({ points }: { points: SeriesPoint[] }) {
  const { t } = useTranslation()
  const [cursor, setCursor] = useState<number | null>(null)
  const values = useMemo(() => points.map((point) => point.value), [points])
  const series = useMemo(() => [{ data: values, color: '--color-ok', fill: true }], [values])
  const [min, max] = paddedRange([...values, NEUTRAL], 5)
  const xLabels = useRelativeDayLabels(FEAR_GREED_DAYS)
  const point = cursor === null ? null : points[cursor]

  return (
    <>
      <ChartCaption left={t('terminal.markets.pulse.trend')} right={<span>{t('terminal.markets.pulse.neutral')}</span>} />
      <DotChart label={t('terminal.markets.pulse.chartLabel')} series={series} min={min} max={max} referenceLine={NEUTRAL} xLabels={xLabels} height="150px" onCursorChange={setCursor} />
      <ChartLegend readout={point && t('terminal.markets.pulse.readout', { date: formatDayMonth(parseIsoDay(point.date), intlLocale()), value: point.value, band: t(`terminal.markets.pulse.bands.${fearGreedBand(point.value)}`) })} />
    </>
  )
}

/** [2.4] Fear & Greed, total market cap, BTC dominance and mempool fees. */
export function CryptoPulsePanel() {
  const { t } = useTranslation()
  const query = combineQueries(useFearGreed(), useCryptoGlobal(), useBitcoinFees())

  return (
    <QueryPanel id="2.4" title={t('terminal.markets.pulse.title')} meta="alt.me · paprika · mempool" query={query} source="alt.me · paprika · mempool">
      {([fearGreed, global, fees]) => {
        const gauge = fearGreedGauge(fearGreed.value)
        const tone = fearGreedTone(fearGreed.value)
        return (
          <>
            <KeyValues>
              <KeyValue label={t('terminal.markets.pulse.fearGreed')}>
                <ToneText tone={tone}>{fearGreed.value} {t(`terminal.markets.pulse.bands.${fearGreedBand(fearGreed.value)}`)}</ToneText>{' '}
                <span className="whitespace-nowrap" aria-hidden>
                  <ToneText tone="dim">[</ToneText><ToneText tone={tone}>{gauge.filled}</ToneText><span className="text-line">{gauge.rest}</span><ToneText tone="dim">]</ToneText>
                </span>
              </KeyValue>
              <KeyValue label={t('terminal.markets.pulse.marketCap')}>{formatUsdCompact(global.marketCapUsd, 1)} <ToneText tone="dim">{t('terminal.markets.pulse.volume', { value: formatUsdCompact(global.volume24hUsd, 1) })}</ToneText></KeyValue>
              <KeyValue label={t('terminal.markets.pulse.dominance')}>BTC {global.btcDominance.toFixed(1)}%</KeyValue>
              <KeyValue label={t('terminal.markets.pulse.fee')}>{fees.fastest} sat/vB <ToneText tone="dim">{t('terminal.markets.pulse.feeNote', { halfHour: fees.halfHour, hour: fees.hour })}</ToneText></KeyValue>
            </KeyValues>
            {fearGreed.history.length > 1 && <FearGreedTrend points={fearGreed.history} />}
          </>
        )
      }}
    </QueryPanel>
  )
}
