import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WidgetShell } from '@/components/layout/widget-shell'
import { useGuardianNews } from '@/features/news/api/guardian'
import { formatRelativeTime } from '@/lib/format-relative-time'
import type { GuardianSection } from '@/features/news/types'
import { useTranslation } from 'react-i18next'

const SECTIONS: { id: GuardianSection; icon: string; color: string }[] = [
  { id: 'technology', icon: '💻', color: '#6366f1' },
  { id: 'science',    icon: '🔬', color: '#06b6d4' },
  { id: 'world',      icon: '🌐', color: '#10b981' },
  { id: 'environment',icon: '🌿', color: '#84cc16' },
  { id: 'business',   icon: '📈', color: '#f59e0b' },
]

function relativeDate(iso: string): string {
  return formatRelativeTime(Math.floor(new Date(iso).getTime() / 1000))
}

// ── Compact article row ────────────────────────────────────────────────────
function ArticleRow({ article, index, section }: {
  article: { id: string; webTitle: string; webUrl: string; webPublicationDate: string; thumbnail: string | null; trailText: string | null; byline: string | null }
  index: number
  section: typeof SECTIONS[number]
}) {
  return (
    <motion.a
      href={article.webUrl}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="group flex gap-2.5 py-2 px-2 rounded-xl hover:bg-white/[0.04] transition-colors flex-shrink-0"
    >
      {/* Thumbnail */}
      {article.thumbnail ? (
        <img
          src={article.thumbnail}
          alt=""
          className="w-12 h-12 rounded-lg object-cover flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
        />
      ) : (
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-xl"
          style={{ background: section.color + '14', border: `1px solid ${section.color}25` }}
        >
          {section.icon}
        </div>
      )}

      {/* Text */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <p
          className="text-[12px] font-medium leading-tight line-clamp-2 group-hover:text-white transition-colors"
          style={{ color: 'rgba(255,255,255,0.80)' }}
        >
          {article.webTitle}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          {article.byline && (
            <span className="text-[10px] text-fg-muted truncate flex-1">{article.byline}</span>
          )}
          <span className="text-[10px] text-fg-subtle flex-shrink-0">
            {relativeDate(article.webPublicationDate)}
          </span>
        </div>
      </div>
    </motion.a>
  )
}

// ── Focused article card ───────────────────────────────────────────────────
function ArticleCard({ article, section }: {
  article: { id: string; webTitle: string; webUrl: string; webPublicationDate: string; thumbnail: string | null; trailText: string | null; byline: string | null }
  section: typeof SECTIONS[number]
}) {
  const { t } = useTranslation()
  return (
    <motion.a
      href={article.webUrl}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative flex flex-col rounded-xl overflow-hidden transition-transform hover:-translate-y-0.5 flex-shrink-0"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Image area with overlay and headline */}
      <div className="relative h-32 overflow-hidden flex-shrink-0">
        {article.thumbnail ? (
          <img
            src={article.thumbnail}
            alt=""
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity scale-100 group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-3xl"
            style={{ background: section.color + '14' }}
          >
            {section.icon}
          </div>
        )}

        {/* Dark gradient overlay */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(6,8,15,0.90) 0%, rgba(6,8,15,0.40) 50%, rgba(6,8,15,0.15) 100%)' }}
        />

        {/* Section tag — top left */}
        <div
          className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
          style={{ background: section.color + '30', color: section.color, border: `1px solid ${section.color}40`, backdropFilter: 'blur(4px)' }}
        >
          {section.icon} {t(`news.sections.${section.id}`)}
        </div>

        {/* Headline — bottom right, aligned to right */}
        <p className="absolute bottom-0 left-0 right-0 px-3 pb-2.5 text-[12px] font-semibold leading-tight line-clamp-3 text-white/90 group-hover:text-white transition-colors text-right">
          {article.webTitle}
        </p>
      </div>

      {/* Footer: byline + date */}
      <div className="flex items-center gap-1.5 px-3 py-2 flex-shrink-0">
        {article.byline && (
          <span className="text-[10px] text-fg-subtle truncate flex-1">{article.byline}</span>
        )}
        <span className="text-[10px] text-fg-subtle flex-shrink-0">
          {relativeDate(article.webPublicationDate)}
        </span>
      </div>

      {article.trailText && (
        <p className="px-3 pb-3 text-[11px] text-fg-muted leading-relaxed line-clamp-2 -mt-1">
          {article.trailText}
        </p>
      )}
    </motion.a>
  )
}

// ── Main widget ────────────────────────────────────────────────────────────
export function NewsWidget({ isFocused = false }: { isFocused?: boolean }) {
  const { t } = useTranslation()
  const [activeSection, setActiveSection] = useState<GuardianSection>('technology')
  const section = SECTIONS.find(s => s.id === activeSection) ?? SECTIONS[0]

  const { data: articles = [], isLoading, error, refetch, dataUpdatedAt } = useGuardianNews(activeSection)

  return (
    <WidgetShell
      title="The Guardian"
      icon={<span className={isFocused ? 'text-2xl' : 'text-base'}>📰</span>}
      isLoading={isLoading}
      error={error}
      onRetry={() => refetch()}
      lastUpdated={dataUpdatedAt || undefined}
      accentColor={section.color}
      isFocused={isFocused}
      fillHeight={isFocused}
      viewRoute="/news"
    >
      {/* ── Section tabs ── */}
      <div className="flex gap-1 mb-3 flex-shrink-0 flex-wrap">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all"
            style={{
              background: activeSection === s.id ? s.color + '20' : 'transparent',
              color: activeSection === s.id ? s.color : 'rgba(255,255,255,0.30)',
              border: `1px solid ${activeSection === s.id ? s.color + '50' : 'transparent'}`,
            }}
          >
            {s.icon} {t(`news.sections.${s.id}`)}
          </button>
        ))}
      </div>

      {/* ── Stats bar (focused only) ── */}
      {isFocused && articles.length > 0 && (
        <div className="flex gap-2 mb-3 flex-shrink-0">
          <div className="flex flex-col justify-between px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] min-w-[60px]">
            <span className="text-[10px] uppercase tracking-widest text-fg-subtle leading-none">{t('news.stats.articles')}</span>
            <span className="text-[22px] font-mono font-bold leading-none mt-1.5" style={{ color: section.color }}>{articles.length}</span>
            <span className="text-[10px] text-fg-subtle mt-1 leading-none">{t(`news.sections.${section.id}`)}</span>
          </div>
          <div className="flex-1 flex flex-col justify-between px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] min-w-0">
            <span className="text-[10px] uppercase tracking-widest text-fg-subtle leading-none">{t('news.stats.latest')}</span>
            <span className="text-[12px] text-white/70 leading-tight mt-1.5 line-clamp-2">{articles[0]?.webTitle}</span>
            <span className="text-[10px] text-fg-subtle mt-1" style={{ color: section.color }}>
              {articles[0] && relativeDate(articles[0].webPublicationDate)}
            </span>
          </div>
        </div>
      )}

      {/* ── Compact list ── */}
      {!isFocused && (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col gap-0.5 overflow-hidden"
          >
            {articles.slice(0, 6).map((article, i) => (
              <ArticleRow key={article.id} article={article} index={i} section={section} />
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* ── Focused grid ── */}
      {isFocused && (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex-1 min-h-0 overflow-y-auto grid grid-cols-3 gap-3 content-start"
          >
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} section={section} />
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </WidgetShell>
  )
}
