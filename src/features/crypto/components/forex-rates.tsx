import { useExchangeRates } from '@/features/crypto/api/coingecko'

export function ForexRates() {
  const { data: forex } = useExchangeRates()

  if (!forex) return <p className="text-sm text-white/30">Dados forex indisponíveis.</p>

  return (
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
  )
}
