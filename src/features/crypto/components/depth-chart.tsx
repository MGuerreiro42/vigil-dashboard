import { useMemo } from 'react'
import { XAxis, YAxis, Tooltip, ResponsiveContainer, Area, CartesianGrid, ComposedChart } from 'recharts'
import type { BinanceOrderBook } from '@/features/crypto/types'
import { formatPrice } from '@/features/crypto/lib/crypto-format'

export function DepthChart({ book }: { book: BinanceOrderBook }) {
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
        <span className="text-fg-subtle">
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
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
              axisLine={false} tickLine={false}
              tickFormatter={(value: number) => formatPrice(value)}
              tickCount={6}
            />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
              axisLine={false} tickLine={false}
            />
            <Tooltip
              contentStyle={{ background: 'rgba(13,17,23,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
              labelFormatter={(value) => `Preço: ${formatPrice(Number(value))}`}
              formatter={(value, name) => [Number(value).toFixed(4), name === 'bid' ? '📗 Bid vol' : '📕 Ask vol']}
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
