import { useTranslation } from 'react-i18next'
import { WidgetShell } from '@/components/layout/widget-shell'
import { formatRelativeTime } from '@/lib/format-relative-time'
import { useHackerNewsFrontPage } from '@/features/hacker-news/api/hacker-news'

const ACCENT = '#ff6600'

export function HackerNewsWidget() {
  const { t } = useTranslation()
  const { data: stories, isLoading, error, refetch, dataUpdatedAt } = useHackerNewsFrontPage()

  return (
    <WidgetShell
      title={t('hackerNews.title')}
      icon={<span className="text-xl font-bold" style={{ color: ACCENT }}>Y</span>}
      isLoading={isLoading}
      error={error}
      onRetry={() => refetch()}
      lastUpdated={dataUpdatedAt || undefined}
      accentColor={ACCENT}
      isFocused
      fillHeight
    >
      {stories && (
        <div className="flex flex-col gap-2 flex-1 min-h-0">
          <ol className="flex-1 min-h-0 overflow-y-auto grid md:grid-cols-2 gap-x-6 content-start">
            {stories.map((story, index) => (
              <li key={story.id} className="flex gap-3 py-2 border-b border-white/[0.04]">
                <span className="w-5 flex-shrink-0 text-right font-mono text-[12px] text-fg-subtle">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <a href={story.url ?? story.discussionUrl} target="_blank" rel="noreferrer" className="text-[13px] text-white/85 hover:text-white">
                    {story.title}
                  </a>
                  {story.domain && <span className="ml-1.5 text-[11px] text-fg-subtle">({story.domain})</span>}
                  <div className="text-[11px] text-fg-subtle mt-0.5">
                    <span style={{ color: ACCENT }}>▲ {story.points}</span>
                    {' · '}{story.author}{' · '}{formatRelativeTime(story.createdAt)}{' · '}
                    <a href={story.discussionUrl} target="_blank" rel="noreferrer" className="hover:text-white/80">
                      {t('hackerNews.comments', { count: story.comments })}
                    </a>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <p className="text-[10px] text-fg-subtle">{t('hackerNews.source')}</p>
        </div>
      )}
    </WidgetShell>
  )
}
