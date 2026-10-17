import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNow } from '@/hooks/use-now'
import { HttpError, type Failure } from '@/lib/http'
import { formatAge, formatCountdown } from '@/lib/terminal-format'
import { Panel, type PanelProps } from './panel'
import { panelStatus, type PanelQuery } from './panel-state'
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

const UNKNOWN_FAILURE: Failure = { code: 'network', status: null }

/** "503 · serviço indisponível": the HTTP status, when there is one, then the error code's text. */
export function FailureText({ failure, separator = ' · ' }: { failure: Failure; separator?: string }) {
  const { t } = useTranslation()
  const reason = t(`terminal.errors.${failure.code}`)
  return <>{failure.status === null ? reason : `${failure.status}${separator}${reason}`}</>
}

/** "aguardando {source}▌" over rim-dot rows shaped like the table to come. */
export function LoadingBody({ source, placeholder = DEFAULT_PLACEHOLDER, timeoutNote = true }: { source: string; placeholder?: string[]; timeoutNote?: boolean }) {
  const { t } = useTranslation()
  return (
    <>
      <span>{t('terminal.panel.waiting', { source })}<span className="animate-blink text-ok" aria-hidden>▌</span></span>
      {placeholder.map((row, index) => <span key={index} className="whitespace-pre text-rim" aria-hidden>{row}</span>)}
      {timeoutNote && <span className="text-dim">{t('terminal.panel.timeoutNote')}</span>}
    </>
  )
}

/** Panel that renders a query's loading, error, degraded (cached) and ready states. */
export function QueryPanel<Data>({ query, source, placeholder = DEFAULT_PLACEHOLDER, retryMs = DEFAULT_RETRY_MS, cacheNote, children, ...panel }: QueryPanelProps<Data>) {
  const { t } = useTranslation()
  const now = useNow(1_000)
  const [waitingSince] = useState(() => Date.now())
  const status = panelStatus(query, waitingSince, now)
  const failing = status.phase === 'error' || status.phase === 'degraded'
  // A rate-limited source may ask for a longer wait than the panel's own cadence
  const retryAfterMs = query.error instanceof HttpError ? query.error.retryAfterMs ?? 0 : 0
  const retryAt = (query.errorUpdatedAt || waitingSince) + Math.max(retryMs, retryAfterMs)

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
        <LoadingBody source={source} placeholder={placeholder} />
      </Panel>
    )
  }

  if (status.phase === 'error' || query.data === undefined) {
    return (
      <Panel {...panel} gap={6} meta={t('terminal.panel.error')} metaTone="err">
        <span><ToneText tone="err">{t('terminal.panel.errorTag')}</ToneText> {source}: <FailureText failure={status.failure ?? UNKNOWN_FAILURE} separator=" " /></span>
        <span className="text-dim">{t('terminal.panel.noPrior')}</span>
        {retryLine}
      </Panel>
    )
  }

  if (status.phase === 'degraded') {
    const age = formatAge(now - query.dataUpdatedAt, true)
    return (
      <Panel {...panel} gap={6} meta={t('terminal.panel.cache', { age })} metaTone="warn">
        <span><ToneText tone="warn">{t('terminal.panel.degradedTag')}</ToneText> {source}: <FailureText failure={status.failure ?? UNKNOWN_FAILURE} /></span>
        {retryLine}
        {cacheNote && <span className="text-dim">{t('terminal.panel.cachedFrom', { age })} · {cacheNote(query.data)}</span>}
        <div className="is-cached contents">{children(query.data)}</div>
      </Panel>
    )
  }

  return <Panel {...panel}>{children(query.data)}</Panel>
}
