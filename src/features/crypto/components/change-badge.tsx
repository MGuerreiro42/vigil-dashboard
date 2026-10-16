

export function ChangeBadge({ pct }: { pct: number }) {
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

/** Live Binance price for one coin, falling back to CoinGecko. Subscribes to that coin only, so other coins' ticks don't re-render it. */
