import { useTranslation } from 'react-i18next'
import { ToneText } from '@/components/terminal/text'
import { ALERT_TONE, highAlertCounts } from '@/features/natural-events/lib/event-terminal'
import type { NaturalEvent } from '@/features/natural-events/types'

/**
 * "2 laranja · 1 vermelho", in each colour; "0" when nothing is on high alert. `wrapOnPhones`: where
 * the value may wrap, phones get a 16px flex-wrap instead of a "·" that could start a line.
 */
export function AlertCounts({ events, wrapOnPhones = false }: { events: NaturalEvent[]; wrapOnPhones?: boolean }) {
  const { t } = useTranslation()
  const counts = highAlertCounts(events)
  if (!counts.length) return '0'
  return (
    <span className={wrapOnPhones ? 'max-sm:inline-flex max-sm:flex-wrap max-sm:gap-x-[16px]' : ''}>
      {counts.map(([level, count], index) => (
        <span key={level} className="whitespace-nowrap">
          {index > 0 && <span className={wrapOnPhones ? 'max-sm:hidden' : ''}> · </span>}
          <ToneText tone={ALERT_TONE[level]}>{count} {t(`terminal.planet.events.alerts.${level}`)}</ToneText>
        </span>
      ))}
    </span>
  )
}
