import { useExchangeRates } from '@/features/crypto/api/coingecko'
import { StatTile } from '@/components/ui/stat-tile'

export function ForexRates() {
  const { data: forex } = useExchangeRates()

  if (!forex) return <p className="text-sm text-fg-subtle">Dados forex indisponíveis.</p>

  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(forex.rates).map(([currency, rate]) => (
        <StatTile key={currency} label={currency} value={rate.toFixed(2)} caption={`por ${forex.base}`} className="min-w-[80px]" />
      ))}
    </div>
  )
}
