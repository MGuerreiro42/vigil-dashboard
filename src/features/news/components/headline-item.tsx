import type { NewsHeadline } from '@/features/news/types'
import { intlLocale } from '@/i18n'
import { formatShortDate, parseIsoDay } from '@/lib/terminal-format'
import { ArticleThumb } from './article-thumb'

export function HeadlineItem({ headline, compact = false }: { headline: NewsHeadline; compact?: boolean }) {
  const content = (
    <>
      <ArticleThumb src={headline.article?.thumbnail ?? null} size={compact ? 36 : 56} />
      <div className="flex-1 min-w-0">
        {headline.date && <div className="text-[10px] uppercase tracking-widest text-fg-subtle mb-0.5">{formatShortDate(parseIsoDay(headline.date), intlLocale())}</div>}
        <p className={`${compact ? 'text-[12px] line-clamp-2' : 'text-[13px]'} text-white/80 leading-snug`}>{headline.text}</p>
        {!compact && headline.article && <div className="text-[11px] text-fg-muted mt-1 truncate">{headline.article.title}</div>}
      </div>
    </>
  )
  const className = `flex items-start gap-3 rounded-lg ${compact ? 'p-1.5' : 'p-2.5'} hover:bg-white/[0.04] transition-colors`
  if (!headline.article) return <div className={className}>{content}</div>
  return (
    <a href={headline.article.url} target="_blank" rel="noopener noreferrer" className={className}>
      {content}
    </a>
  )
}
