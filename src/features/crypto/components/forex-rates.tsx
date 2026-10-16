import { useExchangeRates } from '@/features/crypto/api/coingecko'
import { StatTile } from '@/components/ui/stat-tile'
import { useTranslation } from 'react-i18next'

export function ForexRates() {
  const { t } = useTranslation()
  const { data: forex } = useExchangeRates()

  if (!forex) return <p className="text-sm text-fg-subtle">{t('crypto.forex.unavailable')}</p>

  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(forex.rates).map(([currency, rate]) => (
        <StatTile key={currency} label={currency} value={rate.toFixed(2)} caption={t('crypto.forex.per', { currency: forex.base })} className="min-w-[80px]" />
      ))}
    </div>
  )
}
