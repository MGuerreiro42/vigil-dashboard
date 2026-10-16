import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { WidgetShell } from '@/components/layout/widget-shell'
import { SegmentedTabs, type TabOption } from '@/components/ui/segmented-tabs'
import { tabPanel } from '@/components/ui/tab-panel'
import { useFeaturedFeed } from '@/features/news/api/wikimedia-feed'
import { ACCENT } from '@/features/news/lib/news-style'
import { HeadlineItem } from './headline-item'
import { OnThisDayItem } from './on-this-day-item'
import { TrendingItem } from './trending-item'

type Tab = 'headlines' | 'trending' | 'onThisDay'

const COMPACT_HEADLINES = 5

export function NewsWidget({ isFocused = false }: { isFocused?: boolean }) {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('headlines')
  const { data: feed, isLoading, error, refetch, dataUpdatedAt } = useFeaturedFeed()
  const currentYear = new Date().getFullYear()

  const tabs: TabOption<Tab>[] = [
    { id: 'headlines', label: t('news.tabs.headlines') },
    { id: 'trending', label: t('news.tabs.trending') },
    { id: 'onThisDay', label: t('news.tabs.onThisDay') },
  ]

  return (
    <WidgetShell
      title={t('news.title')}
      icon={<span className={isFocused ? 'text-2xl' : 'text-base'}>📰</span>}
      isLoading={isLoading}
      error={error}
      onRetry={() => refetch()}
      lastUpdated={dataUpdatedAt || undefined}
      accentColor={ACCENT}
      isFocused={isFocused}
      fillHeight={isFocused}
      viewRoute="/news"
    >
      {feed && !isFocused && (
        <div className="flex flex-col gap-0.5">
          {feed.headlines.length === 0 && <p className="text-sm text-fg-subtle">{t('news.empty')}</p>}
          {feed.headlines.slice(0, COMPACT_HEADLINES).map((headline) => (
            <HeadlineItem key={headline.id} headline={headline} compact />
          ))}
          <p className="text-[10px] text-fg-subtle mt-1">{t('news.source')}</p>
        </div>
      )}

      {feed && isFocused && (
        <div className="flex flex-col gap-3 flex-1 min-h-0">
          <div className="flex items-center justify-between gap-3">
            <SegmentedTabs tabs={tabs} active={tab} onChange={setTab} accent={ACCENT} />
            <span className="text-[11px] text-fg-subtle">{t('news.source')}</span>
          </div>
          <div className="flex-1 min-h-0 relative">
            <div {...tabPanel(tab === 'headlines', { overflowY: 'auto' })}>
              {feed.headlines.length === 0 && <p className="text-sm text-fg-subtle">{t('news.empty')}</p>}
              <div className="grid md:grid-cols-2 gap-1">
                {feed.headlines.map((headline) => <HeadlineItem key={headline.id} headline={headline} />)}
              </div>
            </div>
            <div {...tabPanel(tab === 'trending', { overflowY: 'auto' })}>
              <div className="grid md:grid-cols-2 gap-x-3">
                {feed.trending.map((article) => <TrendingItem key={article.url} article={article} />)}
              </div>
            </div>
            <div {...tabPanel(tab === 'onThisDay', { overflowY: 'auto' })}>
              {feed.onThisDay.map((event) => (
                <OnThisDayItem key={`${event.year}-${event.text.slice(0, 24)}`} event={event} currentYear={currentYear} />
              ))}
            </div>
          </div>
        </div>
      )}
    </WidgetShell>
  )
}
