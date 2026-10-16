import { useTranslation } from 'react-i18next'
import { intlLocale } from '@/i18n'
import { ACCENT } from '@/features/news/lib/news-style'
import type { TrendingArticle } from '@/features/news/types'
import { ArticleThumb } from './article-thumb'

const SPARK_WIDTH = 64
const SPARK_HEIGHT = 20

/** Daily views as a tiny inline line; SVG instead of a chart library per row. */
function ViewsSparkline({ history }: { history: number[] }) {
  if (history.length < 2) return null
  const max = Math.max(...history)
  const points = history
    .map((views, index) => `${(index / (history.length - 1)) * SPARK_WIDTH},${SPARK_HEIGHT - (views / max) * SPARK_HEIGHT}`)
    .join(' ')
  return (
    <svg width={SPARK_WIDTH} height={SPARK_HEIGHT} aria-hidden className="flex-shrink-0">
      <polyline points={points} fill="none" stroke={ACCENT} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  )
}

export function TrendingItem({ article }: { article: TrendingArticle }) {
  const { t } = useTranslation()
  return (
    <a href={article.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg p-2 hover:bg-white/[0.04] transition-colors">
      <span className="w-6 text-right text-[12px] font-mono text-fg-subtle flex-shrink-0">{article.rank}</span>
      <ArticleThumb src={article.thumbnail} size={40} />
      <div className="flex-1 min-w-0">
        <div className="text-[13px] text-white/85 truncate">{article.title}</div>
        <div className="text-[11px] text-fg-muted truncate">
          {t('news.views', { value: article.views.toLocaleString(intlLocale()) })}
          {article.description && ` · ${article.description}`}
        </div>
      </div>
      <ViewsSparkline history={article.history} />
    </a>
  )
}
