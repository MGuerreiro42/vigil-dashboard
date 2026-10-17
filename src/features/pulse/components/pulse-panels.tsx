import { useTranslation } from 'react-i18next'
import { Cell, DataTable, TableRow } from '@/components/terminal/data-table'
import { QueryPanel, LoadingBody } from '@/components/terminal/query-panel'
import { Stat, StatLine } from '@/components/terminal/stat-line'
import { StreamPanel } from '@/components/terminal/stream-panel'
import { EmptyState, ExternalLink, Sparkline, ToneText } from '@/components/terminal/text'
import { TONE_CLASS } from '@/components/terminal/tone'
import { byteDelta } from '@/features/news/lib/news-terminal'
import { useBlueskyTrends } from '@/features/pulse/api/bluesky-trends'
import { useWikiEditStream, WIKIMEDIA_STREAM } from '@/features/pulse/hooks/use-wiki-edit-stream'
import type { BlueskyTrend, EditStreamSummary, LiveEdit } from '@/features/pulse/types'
import { intlLocale } from '@/i18n'
import { useSourceHealthStore } from '@/store/source-health-store'

const EDIT_ROWS = 12
const TREND_ROWS = 10
const SPARK_BUCKET_SECONDS = 4
const EDITS_PLACEHOLDER = [
  '··  ························  ·········  ····',
  '··  ··················  ···········  ···',
  '··  ·····················  ········  ·····',
]

/** Edits per bucket of a few seconds, so the minute fits a short sparkline. */
function bucketed(perSecond: number[]): number[] {
  const buckets: number[] = []
  for (let start = 0; start < perSecond.length; start += SPARK_BUCKET_SECONDS) {
    buckets.push(perSecond.slice(start, start + SPARK_BUCKET_SECONDS).reduce((sum, count) => sum + count, 0))
  }
  return buckets
}

function EditsBody({ summary, feed }: { summary: EditStreamSummary; feed: LiveEdit[] }) {
  const { t } = useTranslation()
  const locale = intlLocale()
  const others = summary.perMinute - summary.topLanguages.reduce((sum, entry) => sum + entry.count, 0)
  const languages = summary.topLanguages.map((entry) => `${entry.language} ${entry.count}`)
  if (others > 0) languages.push(`${t('terminal.news.edits.others')} ${others}`)

  return (
    <>
      <StatLine wide={false}>
        <span>{t('terminal.news.edits.perMinute')} <span className="text-text">{summary.perMinute}</span> <Sparkline values={bucketed(summary.perSecond)} /></span>
        <Stat label={t('terminal.news.edits.bots')}>{Math.round(summary.botShare * 100)}%</Stat>
        <span>{t('terminal.news.edits.newArticles')} <ToneText tone="ok">{summary.newArticles}</ToneText> {t('terminal.news.edits.lastMinute')}</span>
      </StatLine>
      {languages.length > 0 && <span className="text-dim">{languages.join(' · ')}</span>}
      {feed.length ? (
        <DataTable columns="32px minmax(0,1fr) minmax(0,140px) 64px" gap="2px 12px">
          {feed.slice(0, EDIT_ROWS).map((edit) => {
            const delta = byteDelta(edit.byteDelta, locale)
            return (
              <TableRow key={edit.id}>
                <Cell className="text-dim">{edit.language}</Cell>
                <Cell truncate><ExternalLink href={edit.url} className="text-text">{edit.title}</ExternalLink></Cell>
                <Cell truncate className="text-dim">{edit.user}</Cell>
                <Cell right className={TONE_CLASS[delta.tone]}>{delta.text}</Cell>
              </TableRow>
            )
          })}
        </DataTable>
      ) : <EmptyState title={t('terminal.news.edits.empty')} hint={t('terminal.news.edits.emptyHint')} />}
      <span className="text-dim">{t('terminal.news.edits.footnote')}</span>
    </>
  )
}

/** [5.2] Wikimedia recent-changes stream: rate, bot share, languages and the latest human edits. */
export function LiveEditsPanel() {
  const { t } = useTranslation()
  const snapshot = useWikiEditStream()
  const stream = useSourceHealthStore((state) => state.streams[WIKIMEDIA_STREAM])
  const lostAt = stream?.lostAt

  return (
    <StreamPanel
      id="5.2"
      title={t('terminal.news.edits.title')}
      gap={10}
      stream={stream}
      source={WIKIMEDIA_STREAM}
      meta={snapshot ? t('terminal.news.edits.meta') : t('terminal.panel.connecting')}
      metaTone={snapshot ? 'dim' : 'info'}
      frozenNote={lostAt && snapshot ? t('terminal.news.edits.frozenAt', { time: new Date(lostAt).toTimeString().slice(0, 8) }) : undefined}
    >
      {snapshot
        ? <EditsBody summary={snapshot.summary} feed={snapshot.feed} />
        : <LoadingBody source={WIKIMEDIA_STREAM} placeholder={EDITS_PLACEHOLDER} timeoutNote={false} />}
    </StreamPanel>
  )
}

function TrendsBody({ trends }: { trends: BlueskyTrend[] }) {
  const { t } = useTranslation()
  if (!trends.length) return <EmptyState title={t('terminal.news.bluesky.empty')} hint={t('terminal.news.bluesky.emptyHint')} />
  return (
    <DataTable columns="24px minmax(0,1fr)" gap="6px 12px">
      {trends.slice(0, TREND_ROWS).map((trend, index) => (
        <TableRow key={trend.id}>
          <Cell className="text-dim">{index + 1}</Cell>
          <Cell className="flex flex-col">
            <ExternalLink href={trend.url} className="text-text">{trend.name}</ExternalLink>
            {trend.description && <span className="text-dim">{trend.description}</span>}
          </Cell>
        </TableRow>
      ))}
    </DataTable>
  )
}

/** [5.3] Bluesky trending topics; the API only serves them in English. */
export function BlueskyTrendsPanel() {
  const { t } = useTranslation()
  const query = useBlueskyTrends()
  return (
    <QueryPanel id="5.3" title={t('terminal.news.bluesky.title')} gap={8} meta={t('terminal.news.bluesky.meta')} query={query} source="bluesky">
      {(trends) => <TrendsBody trends={trends} />}
    </QueryPanel>
  )
}
