import { useTranslation } from 'react-i18next'
import { WidgetShell } from '@/components/layout/widget-shell'
import { formatRelativeTime } from '@/lib/format-relative-time'
import { useSpaceNews } from '@/features/space/api/spaceflight-news'
import { ACCENT } from '@/features/space/lib/space-style'

export function SpaceNewsWidget() {
  const { t } = useTranslation()
  const { data: articles, isLoading, error, refetch, dataUpdatedAt } = useSpaceNews()

  return (
    <WidgetShell
      title={t('space.news.title')}
      icon={<span className="text-xl">🛰️</span>}
      isLoading={isLoading}
      error={error}
      onRetry={() => refetch()}
      lastUpdated={dataUpdatedAt || undefined}
      accentColor={ACCENT}
      isFocused
      fillHeight
    >
      <ul className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1">
        {articles?.map((article) => (
          <li key={article.id}>
            <a href={article.url} target="_blank" rel="noopener noreferrer" className="flex gap-3 rounded-lg p-2 hover:bg-white/[0.04]">
              {article.image && <img src={article.image} alt="" loading="lazy" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-white/85 leading-snug line-clamp-2">{article.title}</div>
                <div className="text-[11px] text-fg-subtle mt-1">{article.site} · {formatRelativeTime(Date.parse(article.publishedAt) / 1000)}</div>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </WidgetShell>
  )
}
