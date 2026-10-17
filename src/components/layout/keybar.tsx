import { useTranslation } from 'react-i18next'
import { countSourceStatuses, useSourceHealthStore } from '@/store/source-health-store'

// Screen-specific keys (space for the radar, n/p for discover) join when those screens are built
const KEYS = ['screen', 'tabs', 'open', 'refresh'] as const

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
export function Keybar({ refreshingScreen }: { refreshingScreen: number | null }) {
  const { t } = useTranslation()
  return (
    <footer className="flex flex-wrap gap-x-[22px] gap-y-[4px] border-t border-line px-[20px] py-[8px] text-dim max-sm:hidden">
      {KEYS.map((key) => (
        <span key={key}><span className="text-text">{t(`terminal.keys.${key}.key`)}</span> {t(`terminal.keys.${key}.label`)}</span>
      ))}
      <span className="ml-auto" role="status">
        {refreshingScreen === null ? <SourcesStatus /> : t('terminal.status.refreshing', { screen: refreshingScreen })}
      </span>
    </footer>
  )
}
