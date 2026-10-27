import { useTranslation } from 'react-i18next'
import { useSourceRows } from '@/hooks/use-source-rows'
import { countRowStatuses } from '@/lib/source-registry'
import type { Screen } from './sections'

const KEYS = ['screen', 'tabs', 'open', 'refresh'] as const
// Shortcuts that only work on one screen are listed while it is open
const SCREEN_KEYS: Partial<Record<Screen['id'], 'discover' | 'radar'>> = { planet: 'radar', news: 'discover' }

function SourcesStatus() {
  const { t } = useTranslation()
  const { rows } = useSourceRows()
  const counts = countRowStatuses(rows)
  if (counts.waiting === rows.length) return <>{t('terminal.status.waiting')}</>
  return (
    <>
      {t('terminal.status.sourcesOk', { count: counts.ok })}
      {counts.degraded > 0 && ` · ${t('terminal.status.degraded', { count: counts.degraded })}`}
      {counts.error > 0 && ` · ${t('terminal.status.failed', { count: counts.error })}`}
      {counts.reconnecting > 0 && ` · ${t('terminal.status.reconnecting', { count: counts.reconnecting })}`}
    </>
  )
}

/** Shortcut legend and live status line (≥600 px; phones get the tab bar instead). */
export function Keybar({ screen, refreshingScreen }: { screen: Screen; refreshingScreen: number | null }) {
  const { t } = useTranslation()
  const screenKey = SCREEN_KEYS[screen.id]
  const keys = screenKey ? [...KEYS, screenKey] : KEYS
  return (
    <footer className="flex flex-wrap gap-x-[22px] gap-y-[4px] border-t border-line px-[20px] py-[8px] text-dim max-sm:hidden">
      {keys.map((key) => (
        <span key={key}><span className="text-text">{t(`terminal.keys.${key}.key`)}</span> {t(`terminal.keys.${key}.label`)}</span>
      ))}
      <span className="ml-auto" role="status">
        {refreshingScreen === null ? <SourcesStatus /> : t('terminal.status.refreshing', { screen: refreshingScreen })}
      </span>
    </footer>
  )
}
