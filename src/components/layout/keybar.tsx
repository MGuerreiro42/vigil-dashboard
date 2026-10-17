import { useTranslation } from 'react-i18next'
import { countSourceStatuses, useSourceHealthStore } from '@/store/source-health-store'
import type { Screen } from './sections'

const KEYS = ['screen', 'tabs', 'open', 'refresh', 'radar'] as const
// Shortcuts that only work on one screen are listed while it is open
const SCREEN_KEYS: Partial<Record<Screen['id'], 'discover'>> = { news: 'discover' }

function SourcesStatus() {
  const { t } = useTranslation()
  const sources = useSourceHealthStore((state) => state.sources)
  const counts = countSourceStatuses(sources)
  if (Object.keys(sources).length === 0) return <>{t('terminal.status.waiting')}</>
  return (
    <>
      {t('terminal.status.sourcesOk', { count: counts.ok })}
      {counts.degraded > 0 && ` · ${t('terminal.status.degraded', { count: counts.degraded })}`}
      {counts.error > 0 && ` · ${t('terminal.status.failed', { count: counts.error })}`}
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
