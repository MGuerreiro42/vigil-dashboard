import type { WikiSummary } from '@/features/wikipedia/types'
import { WikiThumb } from './wiki-thumb'
import { ACCENT } from '@/features/wikipedia/lib/article-format'

export function CompactCard({
  article,
  onNext,
  isLoading,
}: {
  article: WikiSummary | undefined
  onNext: () => void
  isLoading: boolean
}) {
  if (isLoading && !article) {
    return (
      <div className="flex flex-col gap-2 animate-pulse flex-1 min-h-0">
        <div className="w-full rounded-xl bg-white/5" style={{ height: 88 }} />
        <div className="h-4 bg-white/5 rounded w-3/4" />
        <div className="h-3 bg-white/5 rounded w-1/2" />
        <div className="h-3 bg-white/5 rounded w-full" />
        <div className="h-3 bg-white/5 rounded w-4/5" />
        <div className="h-3 bg-white/5 rounded w-2/3" />
      </div>
    )
  }

  if (!article) return null

  return (
    <div className="flex flex-col gap-2 flex-1 min-h-0">
      {/* Image */}
      <div className="w-full flex-shrink-0 rounded-xl overflow-hidden relative" style={{ height: 88 }}>
        <WikiThumb
          src={article.thumbnail?.source}
          alt={article.title}
          className="w-full h-full"
        />
        {article.coordinates && (
          <span
            className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-mono"
            style={{ background: 'rgba(0,0,0,0.72)', color: ACCENT }}
          >
            📍 {article.coordinates.lat.toFixed(1)}°
          </span>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-h-0 flex flex-col gap-1 overflow-hidden">
        <h3 className="text-[13px] font-semibold text-white/90 leading-snug line-clamp-2">
          {article.title}
        </h3>
        {article.description && (
          <p className="text-[11px] text-white/38 leading-snug line-clamp-1">
            {article.description}
          </p>
        )}
        <p className="text-[12px] text-white/55 leading-relaxed line-clamp-4">
          {article.extract}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between flex-shrink-0 mt-1">
        <a
          href={article.content_urls.desktop.page}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] transition-opacity hover:opacity-70"
          style={{ color: ACCENT + '90' }}
        >
          wikipedia ↗
        </a>
        <button
          onClick={onNext}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-opacity hover:opacity-75"
          style={{ background: ACCENT + '18', color: ACCENT, border: `1px solid ${ACCENT}28` }}
        >
          Next →
        </button>
      </div>
    </div>
  )
}
