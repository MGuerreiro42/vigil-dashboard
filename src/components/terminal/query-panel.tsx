import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNow } from '@/hooks/use-now'
import { formatAge, formatCountdown } from '@/lib/terminal-format'
import type { FailureCause } from '@/store/source-health-store'
import { Panel, type PanelProps } from './panel'
import { causeKey, panelStatus, type PanelQuery } from './panel-state'
import { BracketButton, ToneText } from './text'

const DEFAULT_RETRY_MS = 60_000
// Shaped like a three-column table: no grey skeleton blocks
const DEFAULT_PLACEHOLDER = [
  '···  ···························  ···',
  '···  ······················  ···',
  '···  ··························  ···',
]

interface QueryPanelProps<Data> extends Omit<PanelProps, 'children'> {
  query: PanelQuery<Data>
  /** Source as named in the UI: "usgs", "nasa neows" */
  source: string
  /** Placeholder rows shaped like the final table */
  placeholder?: string[]
  /** How long after a failure the panel retries on its own */
  retryMs?: number
  /** What the cache holds, shown under a degraded header: "14 objetos · 2 potencialmente perigosos" */
  cacheNote?: (data: Data) => ReactNode
  children: (data: Data) => ReactNode
}

function CauseText({ cause, separator }: { cause: FailureCause; separator: string }) {
  const { t } = useTranslation()
  const reason = t(`terminal.causes.${causeKey(cause)}`)
  return <>{typeof cause === 'number' ? `${cause}${separator}${reason}` : reason}</>
}

/** Panel that renders a query's loading, error, degraded (cached) and ready states. */
export function QueryPanel<Data>({ query, source, placeholder = DEFAULT_PLACEHOLDER, retryMs = DEFAULT_RETRY_MS, cacheNote, children, ...panel }: QueryPanelProps<Data>) {
  const { t } = useTranslation()
  const now = useNow(1_000)
  const [waitingSince] = useState(() => Date.now())
  const status = panelStatus(query, waitingSince, now)
  const failing = status.phase === 'error' || status.phase === 'degraded'
  const retryAt = (query.errorUpdatedAt || waitingSince) + retryMs

  const { refetch } = query
  useEffect(() => {
    if (!failing) return
    const timer = setTimeout(() => refetch(), Math.max(0, retryAt - Date.now()))
    return () => clearTimeout(timer)
  }, [failing, retryAt, refetch])

  const retryLine = (
    <span className="text-dim">
      {t('terminal.panel.retryIn', { time: formatCountdown(retryAt - now) })} · <BracketButton onClick={() => refetch()}>{t('terminal.panel.retryNow')}</BracketButton>
    </span>
  )

  if (status.phase === 'loading') {
    return (
      <Panel {...panel} gap={6} meta={t('terminal.panel.connecting')} metaTone="info">
        <span>{t('terminal.panel.waiting', { source })}<span className="animate-blink text-ok" aria-hidden>▌</span></span>
        {placeholder.map((row, index) => <span key={index} className="whitespace-pre text-rim" aria-hidden>{row}</span>)}
        <span className="text-dim">{t('terminal.panel.timeoutNote')}</span>
      </Panel>
    )
  }

  if (status.phase === 'error' || query.data === undefined) {
    return (
      <Panel {...panel} gap={6} meta={t('terminal.panel.error')} metaTone="err">
        <span><ToneText tone="err">{t('terminal.panel.errorTag')}</ToneText> {source}: <CauseText cause={status.cause ?? 'network'} separator=" " /></span>
        <span className="text-dim">{t('terminal.panel.noPrior')}</span>
        {retryLine}
      </Panel>
    )
  }

  if (status.phase === 'degraded') {
    const age = formatAge(now - query.dataUpdatedAt, true)
    return (
      <Panel {...panel} gap={6} meta={t('terminal.panel.cache', { age })} metaTone="warn">
        <span><ToneText tone="warn">{t('terminal.panel.degradedTag')}</ToneText> {source}: <CauseText cause={status.cause ?? 'network'} separator=" · " /></span>
        {retryLine}
        {cacheNote && <span className="text-dim">{t('terminal.panel.cachedFrom', { age })} · {cacheNote(query.data)}</span>}
        <div className="is-cached contents">{children(query.data)}</div>
      </Panel>
    )
  }

  return <Panel {...panel}>{children(query.data)}</Panel>
}
