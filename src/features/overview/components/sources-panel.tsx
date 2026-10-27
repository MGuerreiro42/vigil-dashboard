import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { Panel, PanelDivider } from '@/components/terminal/panel'
import { ToneText } from '@/components/terminal/text'
import { TONE_CLASS } from '@/components/terminal/tone'
import { countRowStatuses, type SourceRow, type SourceRowStatus } from '@/lib/source-registry'
import { formatAge, type Tone } from '@/lib/terminal-format'

const STATUS_STYLE: Record<SourceRowStatus, { glyph: string; tone: Tone }> = {
  ok: { glyph: '●', tone: 'ok' },
  degraded: { glyph: '◐', tone: 'warn' },
  error: { glyph: '✕', tone: 'err' },
  reconnecting: { glyph: '↻', tone: 'info' },
  waiting: { glyph: '·', tone: 'dim' },
}

function useLatencyLabel() {
  const { t } = useTranslation()
  return ({ status, latency }: SourceRow) => {
    if (latency === null) return '—'
    if (latency === 'live' || latency === 'timeout' || latency === 'network') return t(`terminal.overview.sources.latency.${latency}`)
    // While failing the number is the HTTP status, otherwise the request time
    return status === 'ok' ? `${latency}ms` : String(latency)
  }
}

/** [1.2] one row per source: status, latency of the last request and age of the newest data. */
export function SourcesPanel({ rows, className }: { rows: SourceRow[]; className: string }) {
  const { t } = useTranslation()
  const latencyLabel = useLatencyLabel()
  const counts = countRowStatuses(rows)
  const meta = t('terminal.overview.sources.meta', { ok: counts.ok })
    + (counts.degraded ? t('terminal.overview.sources.metaDegraded', { count: counts.degraded }) : '')
    + (counts.error ? t('terminal.overview.sources.metaFailed', { count: counts.error }) : '')

  return (
    <Panel id="1.2" title={t('terminal.overview.sources.title')} meta={meta} gap={6} className={className}>
      <div className="grid grid-cols-[14px_minmax(0,1fr)_auto_52px_40px] gap-x-[10px] gap-y-[2px]">
        {rows.map((row) => {
          const { glyph, tone } = STATUS_STYLE[row.status]
          return (
            <Fragment key={row.entry.label}>
              <span aria-hidden className={TONE_CLASS[tone]}>{glyph}</span>
              <span className={`overflow-hidden text-ellipsis whitespace-nowrap ${TONE_CLASS[row.status === 'ok' ? 'text' : tone]}`}>{row.entry.label}</span>
              <span className={TONE_CLASS[tone]}>{t(`terminal.overview.sources.statuses.${row.status}`)}</span>
              <span className="text-right text-dim">{latencyLabel(row)}</span>
              <span className="text-right text-dim">{row.ageMs === null ? '—' : formatAge(row.ageMs)}</span>
            </Fragment>
          )
        })}
      </div>
      <PanelDivider tight className="text-dim">
        <ToneText tone="ok">{t('terminal.overview.sources.legend.ok')}</ToneText>
        {' · '}<ToneText tone="warn">{t('terminal.overview.sources.legend.degraded')}</ToneText> {t('terminal.overview.sources.legend.degradedNote')}
        {' · '}<ToneText tone="err">{t('terminal.overview.sources.legend.error')}</ToneText> {t('terminal.overview.sources.legend.errorNote')}
        {' · '}<ToneText tone="info">{t('terminal.overview.sources.legend.reconnecting')}</ToneText>
        {' · '}{t('terminal.overview.sources.legend.columns')}
      </PanelDivider>
    </Panel>
  )
}
