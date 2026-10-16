import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, CartesianGrid } from 'recharts'
import { ACCENT, formatPrice } from '@/features/crypto/lib/crypto-format'
import type { CryptoAsset } from '@/features/crypto/types'
import { ChangeBadge } from './change-badge'
import { LivePrice } from './live-price'
import { chartTooltipStyle } from '@/lib/chart-styles'
import { useTranslation } from 'react-i18next'

const SPARKLINE_HOURS = 168

/** 7-day price area for the selected coin, or 24h change bars for every coin when none is selected. */
export function PriceChart({ coins, selectedCoin }: { coins: CryptoAsset[]; selectedCoin: CryptoAsset | null }) {
  const { t } = useTranslation()
  const chartData = selectedCoin
    ? selectedCoin.sparkline.slice(-SPARKLINE_HOURS).map((price, index) => ({ i: index, v: price }))
    : []

  // Tight Y domain: 10% padding around the actual range
  const chartDomain = useMemo<[number | string, number | string]>(() => {
    if (!selectedCoin) return ['auto', 'auto']
    const prices = selectedCoin.sparkline.slice(-SPARKLINE_HOURS).filter((price) => price > 0)
    if (!prices.length) return ['auto', 'auto']
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const padding = (max - min) * 0.1 || min * 0.01
    return [min - padding, max + padding]
  }, [selectedCoin])

  return (
    <>
    {selectedCoin ? (
      <>
        <div className="flex items-baseline gap-2 flex-shrink-0">
          <span className="text-sm font-semibold text-white/80">{selectedCoin.name}</span>
          <LivePrice coin={selectedCoin} className="text-[13px] text-white/60" />
          <ChangeBadge pct={selectedCoin.change7d} />
          <span className="text-[11px] text-fg-subtle ml-1">7d</span>
        </div>
        <div style={{ flex: 1, position: 'relative' }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: '#06080f', borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden',
          }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 16, right: 16, left: -20, bottom: 8 }}>
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
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                  axisLine={false} tickLine={false}
                  tickFormatter={(value) => `$${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value.toFixed(0)}`}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(value) => [formatPrice(Number(value)), selectedCoin.symbol]}
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
        <p className="text-[11px] text-fg-muted uppercase tracking-widest mb-2">{t('crypto.change24h')}</p>
        <div style={{
          position: 'absolute', inset: 0, top: 24,
          background: '#06080f', borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden',
        }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={coins.map((coin) => ({ name: coin.symbol, pct: parseFloat(coin.change24h.toFixed(2)) }))}
              margin={{ top: 16, right: 16, left: -16, bottom: 8 }}
            >
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.62)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip
                contentStyle={chartTooltipStyle}
                formatter={(value) => [`${Number(value) > 0 ? '+' : ''}${value}%`, t('crypto.change')]}
                labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
              />
              <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                {coins.map((coin, index) => (
                  <Cell key={index} fill={coin.change24h >= 0 ? '#10b981' : '#f43f5e'} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    )}
    </>
  )
}
