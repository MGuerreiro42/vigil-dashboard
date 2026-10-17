import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNow } from '@/hooks/use-now'
import { MAX_RECONNECT_ATTEMPTS } from '@/lib/reconnecting-socket'
import type { StreamHealth } from '@/store/source-health-store'
import { Panel, type PanelProps } from './panel'
import { ToneText } from './text'

const RECOVERED_NOTICE_MS = 3_000

interface StreamPanelProps extends PanelProps {
  stream: StreamHealth | undefined
  /** Stream as named in the UI: "binance ws" */
  source: string
  /** Dim line under the reconnecting header, e.g. "preços congelados às 19:03:07" */
  frozenNote?: ReactNode
}

/** Panel fed by a live stream: shows reconnect attempts, frozen values in dim, and a short "reconnected" footer. */
export function StreamPanel({ stream, source, frozenNote, children, meta, metaTone, ...panel }: StreamPanelProps) {
  const { t } = useTranslation()
  const now = useNow(1_000)
  const seconds = (ms: number) => Math.max(0, Math.round(ms / 1000))
  const recovered = stream?.recoveredAt && now - stream.recoveredAt < RECOVERED_NOTICE_MS ? stream : null

  if (stream?.state === 'reconnecting' || stream?.state === 'error') {
    const failed = stream.state === 'error'
    return (
      <Panel
        {...panel}
        gap={6}
        meta={failed ? t('terminal.panel.error') : t('terminal.panel.reconnecting', { attempt: stream.attempt, max: MAX_RECONNECT_ATTEMPTS })}
        metaTone={failed ? 'err' : 'info'}
      >
        <span>
          {failed
            ? <><ToneText tone="err">{t('terminal.panel.errorTag')}</ToneText> {t('terminal.panel.streamFailed', { source, max: MAX_RECONNECT_ATTEMPTS })}</>
            : <><ToneText tone="info">↻</ToneText> {t('terminal.panel.streamLost', { source, lost: seconds(now - (stream.lostAt ?? now)), retry: seconds((stream.nextRetryAt ?? now) - now) })}</>}
        </span>
        {frozenNote && <span className="text-dim">{frozenNote}</span>}
        <div className="is-cached contents">{children}</div>
      </Panel>
    )
  }

  return (
    <Panel {...panel} meta={meta} metaTone={metaTone}>
      {children}
      {recovered && (
        <span className="border-t border-line-subtle pt-[6px]">
          <ToneText tone="ok">{t('terminal.panel.reconnected')}</ToneText>{' '}
          <ToneText tone="dim">{t('terminal.panel.downFor', { seconds: seconds(recovered.recoveredAfterMs ?? 0) })}</ToneText>
        </span>
      )}
    </Panel>
  )
}
