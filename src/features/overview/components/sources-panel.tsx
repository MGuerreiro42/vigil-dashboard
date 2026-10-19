import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Panel, PanelDivider } from '@/components/terminal/panel'
import { BracketButton, LegendGrid, ToneText } from '@/components/terminal/text'
import { TONE_CLASS } from '@/components/terminal/tone'
import { countRowStatuses, phoneListedRows, type SourceRow, type SourceRowStatus } from '@/lib/source-registry'
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
  return ({ latency, failure }: SourceRow) => {
    // While failing the column names the failure: the HTTP status when there is one, else a short code
    if (failure) return failure.status === null ? t(`terminal.overview.sources.latency.${failure.code}`) : String(failure.status)
    if (latency === null) return '—'
    if (latency === 'live' || latency === 'cache') return t(`terminal.overview.sources.latency.${latency}`)
    return `${latency}ms`
  }
}

/** [1.2] one row per source: status, latency of the last request and age of the newest data. */
export function SourcesPanel({ rows, className }: { rows: SourceRow[]; className: string }) {
  const { t } = useTranslation()
  const latencyLabel = useLatencyLabel()
  const counts = countRowStatuses(rows)
  const [expanded, setExpanded] = useState(false)
  const phoneRows = phoneListedRows(rows, expanded)
  const legendItem = (status: SourceRowStatus, note?: string) => (
    <span><ToneText tone={STATUS_STYLE[status].tone} className="font-semibold">{STATUS_STYLE[status].glyph}</ToneText> {t(`terminal.overview.sources.statuses.${status}`)}{note && ` · ${note}`}</span>
  )
  const meta = t('terminal.overview.sources.meta', { ok: counts.ok })
    + (counts.degraded ? t('terminal.overview.sources.metaDegraded', { count: counts.degraded }) : '')
    + (counts.error ? t('terminal.overview.sources.metaFailed', { count: counts.error }) : '')

  return (
    <Panel id="1.2" title={t('terminal.overview.sources.title')} meta={meta} gap={6} className={className}>
      <div className="grid grid-cols-[14px_minmax(0,1fr)_auto_8ch_40px] gap-x-[10px] gap-y-[2px]">
        {rows.map((row) => {
          const { glyph, tone } = STATUS_STYLE[row.status]
          // A waiting source is named in text: only its status is dim
          const nameTone = row.status === 'ok' || row.status === 'waiting' ? 'text' : tone
          return (
            <div key={row.entry.label} className={`contents ${phoneRows.includes(row) ? '' : 'max-sm:hidden'}`}>
              <span aria-hidden className={TONE_CLASS[tone]}>{glyph}</span>
              <span className={`overflow-hidden text-ellipsis whitespace-nowrap ${TONE_CLASS[nameTone]}`}>{row.entry.label}</span>
              <span className={TONE_CLASS[tone]}>{t(`terminal.overview.sources.statuses.${row.status}`)}</span>
              <span className="whitespace-nowrap text-right text-dim">{latencyLabel(row)}</span>
              <span className="text-right text-dim">{row.ageMs === null ? '—' : formatAge(row.ageMs)}</span>
            </div>
          )
        })}
      </div>
      <div className="flex min-h-touch items-center justify-between gap-[12px] sm:hidden">
        <span><ToneText tone="ok">●</ToneText> {t('terminal.overview.sources.okCount', { count: counts.ok })}</span>
        <BracketButton aria-expanded={expanded} className="min-h-touch" onClick={() => setExpanded(!expanded)}>
          {expanded ? t('terminal.overview.sources.collapse') : t('terminal.overview.sources.showAll', { count: rows.length })}
        </BracketButton>
      </div>
      <PanelDivider tight>
        <LegendGrid minItem={170}>
          {legendItem('ok')}
          {legendItem('degraded', t('terminal.overview.sources.legend.degradedNote'))}
          {legendItem('error', t('terminal.overview.sources.legend.errorNote'))}
          {legendItem('reconnecting')}
          <span className="text-dim">{t('terminal.overview.sources.legend.columns')}</span>
        </LegendGrid>
      </PanelDivider>
    </Panel>
  )
}
