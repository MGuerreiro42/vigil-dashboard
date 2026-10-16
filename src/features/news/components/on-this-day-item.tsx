import { useTranslation } from 'react-i18next'
import { ACCENT } from '@/features/news/lib/news-style'
import type { OnThisDayEvent } from '@/features/news/types'
import { ArticleThumb } from './article-thumb'

export function OnThisDayItem({ event, currentYear }: { event: OnThisDayEvent; currentYear: number }) {
  const { t } = useTranslation()
  const body = (
    <>
      <div className="w-14 flex-shrink-0 text-right">
        <div className="text-[15px] font-mono font-bold" style={{ color: ACCENT }}>{event.year}</div>
        <div className="text-[10px] text-fg-subtle">{t('news.yearsAgo', { count: currentYear - event.year })}</div>
      </div>
      <p className="flex-1 text-[13px] text-white/80 leading-snug">{event.text}</p>
      <ArticleThumb src={event.article?.thumbnail ?? null} size={44} />
    </>
  )
  const className = 'flex items-start gap-3 rounded-lg p-2.5 hover:bg-white/[0.04] transition-colors'
  if (!event.article) return <div className={className}>{body}</div>
  return <a href={event.article.url} target="_blank" rel="noopener noreferrer" className={className}>{body}</a>
}
