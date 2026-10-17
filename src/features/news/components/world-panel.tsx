import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Cell, DataTable, TableRow } from '@/components/terminal/data-table'
import { autoFitGrid } from '@/components/terminal/grid'
import { QueryPanel } from '@/components/terminal/query-panel'
import { tabId, tabPanelId } from '@/components/terminal/tab-ids'
import { Tabs } from '@/components/terminal/tabs'
import { EmptyState, ExternalLink } from '@/components/terminal/text'
import { useFeaturedFeed } from '@/features/news/api/wikimedia-feed'
import type { FeaturedFeed } from '@/features/news/types'
import { intlLocale } from '@/i18n'
import { formatShortDate, parseIsoDay } from '@/lib/terminal-format'

const ROWS = 10
const VIEWS = ['headlines', 'trending', 'onThisDay'] as const
type View = (typeof VIEWS)[number]

function Headlines({ feed }: { feed: FeaturedFeed }) {
  const { t } = useTranslation()
  const locale = intlLocale()
  if (!feed.headlines.length) return <EmptyState title={t('terminal.news.world.emptyHeadlines')} hint={t('terminal.news.world.emptyHint')} />
  return (
    <div style={{ ...autoFitGrid(440), gap: '12px 32px' }}>
      {feed.headlines.slice(0, ROWS).map((headline) => (
        <div key={headline.id} className="grid grid-cols-[52px_minmax(0,1fr)] gap-x-[12px]">
          <span className="text-dim">{headline.date ? formatShortDate(parseIsoDay(headline.date), locale, true) : '—'}</span>
          <span className="flex min-w-0 flex-col">
            <span className="text-pretty">{headline.text}</span>
            {headline.article && <ExternalLink href={headline.article.url} className="text-dim">↳ {headline.article.title}</ExternalLink>}
          </span>
        </div>
      ))}
    </div>
  )
}

function Trending({ feed, language }: { feed: FeaturedFeed; language: string }) {
  const { t } = useTranslation()
  const locale = intlLocale()
  if (!feed.trending.length) return <EmptyState title={t('terminal.news.world.emptyTrending')} hint={t('terminal.news.world.emptyHint')} />
  const columns = 'terminal.news.world.columns'
  return (
    <DataTable
      columns="24px minmax(0,1fr) 72px"
      gap="4px 12px"
      header={[{ label: '#' }, { label: t(`${columns}.article`, { wiki: `${language}.wikipedia` }) }, { label: t(`${columns}.views`), right: true }]}
    >
      {feed.trending.slice(0, ROWS).map((article) => (
        <TableRow key={article.url}>
          <Cell className="text-dim">{article.rank}</Cell>
          <Cell truncate>
            <ExternalLink href={article.url} className="text-text">{article.title}</ExternalLink>
            {article.description && <span className="text-dim"> · {article.description}</span>}
          </Cell>
          <Cell right>{article.views.toLocaleString(locale)}</Cell>
        </TableRow>
      ))}
    </DataTable>
  )
}

function OnThisDay({ feed }: { feed: FeaturedFeed }) {
  const { t } = useTranslation()
  const year = new Date().getFullYear()
  if (!feed.onThisDay.length) return <EmptyState title={t('terminal.news.world.emptyOnThisDay')} hint={t('terminal.news.world.emptyHint')} />
  return (
    <DataTable columns="52px minmax(96px,max-content) minmax(0,1fr)" gap="6px 12px">
      {feed.onThisDay.slice(0, ROWS).map((event) => (
        <TableRow key={`${event.year}-${event.text}`}>
          <Cell className="text-info">{event.year}</Cell>
          <Cell className="text-dim">{t('terminal.news.world.yearsAgo', { count: year - event.year })}</Cell>
          <Cell className="text-pretty">{event.text}</Cell>
        </TableRow>
      ))}
    </DataTable>
  )
}

function WorldBody({ feed, view, onView }: { feed: FeaturedFeed; view: View; onView: (view: View) => void }) {
  const { t, i18n } = useTranslation()
  const tabsId = useId()
  return (
    <>
      <Tabs label={t('terminal.news.world.tabs.label')} idBase={tabsId} value={view} onChange={onView} items={VIEWS.map((id) => ({ id, label: t(`terminal.news.world.tabs.${id}`) }))} />
      <div role="tabpanel" id={tabPanelId(tabsId, view)} aria-labelledby={tabId(tabsId, view)} className="min-w-0">
        {view === 'headlines' && <Headlines feed={feed} />}
        {view === 'trending' && <Trending feed={feed} language={i18n.resolvedLanguage === 'pt' ? 'pt' : 'en'} />}
        {view === 'onThisDay' && <OnThisDay feed={feed} />}
      </div>
    </>
  )
}

/** [5.1] Wikipedia current events, most read and on this day, in the UI language. */
export function WorldPanel() {
  const { t } = useTranslation()
  const query = useFeaturedFeed()
  // Kept here so a failed refetch, which swaps the panel frame, does not reset the tab
  const [view, setView] = useState<View>('headlines')
  return (
    <QueryPanel id="5.1" title={t('terminal.news.world.title')} gap={12} meta={t('terminal.news.world.meta')} query={query} source="wikimedia feed">
      {(feed) => <WorldBody feed={feed} view={view} onView={setView} />}
    </QueryPanel>
  )
}
