import { useTranslation } from 'react-i18next'
import { ToneText } from '@/components/terminal/text'
import { ALERT_TONE, highAlertCounts } from '@/features/natural-events/lib/event-terminal'
import type { NaturalEvent } from '@/features/natural-events/types'

/** "2 laranja · 1 vermelho", in each colour; "0" when nothing is on high alert. */
export function AlertCounts({ events }: { events: NaturalEvent[] }) {
  const { t } = useTranslation()
  const counts = highAlertCounts(events)
  if (!counts.length) return '0'
  return counts.map(([level, count], index) => (
    <span key={level}>{index > 0 && ' · '}<ToneText tone={ALERT_TONE[level]}>{count} {t(`terminal.planet.events.alerts.${level}`)}</ToneText></span>
  ))
}
