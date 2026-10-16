import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useRandomWikipedia } from '@/features/wikipedia/api/wikipedia'
import { useAutoAdvance } from '@/hooks/use-auto-advance'
import { useTranslation } from 'react-i18next'


const WIKI_ACCENT = '#a78bfa'
const WIKI_AUTO_MS = 3 * 60 * 1000

export function WikiDiscoverCard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [seed, setSeed] = useState(() => Date.now())
  const { data: article, isLoading } = useRandomWikipedia('en', seed)
  const progress = useAutoAdvance(WIKI_AUTO_MS, seed, () => setSeed((current) => current + 1))

  return (
    <div className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-2.5 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="font-serif font-black leading-none" style={{ fontSize: 14, color: WIKI_ACCENT }}>W</span>
          <span className="text-[10px] uppercase tracking-widest text-fg-subtle">{t('brief.discover')}</span>
        </div>
        <button
          onClick={() => navigate('/news#discover')}
          className="text-[10px] text-fg-subtle hover:text-white/50 transition-colors"
        >
          {t('brief.expand')}
        </button>
      </div>

      {/* Content */}
      {isLoading && !article ? (
        <div className="flex-1 flex flex-col gap-1.5 animate-pulse">
          <div className="flex gap-2">
            <div className="w-11 h-11 rounded-lg bg-white/5 flex-shrink-0" />
            <div className="flex-1 flex flex-col gap-1.5 pt-0.5">
              <div className="h-3 bg-white/5 rounded w-full" />
              <div className="h-3 bg-white/5 rounded w-3/4" />
            </div>
          </div>
          <div className="h-2.5 bg-white/5 rounded w-full" />
          <div className="h-2.5 bg-white/5 rounded w-5/6" />
        </div>
      ) : article ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={article.pageid}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col gap-2 min-h-0"
          >
            {/* Thumb + title */}
            <div className="flex gap-2">
              <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0">
                {article.thumbnail ? (
                  <img src={article.thumbnail.source} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ background: 'rgba(167,139,250,0.10)' }}
                  >
                    <span className="font-serif font-bold text-fg-subtle text-sm">W</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-white/88 leading-snug line-clamp-2">
                  {article.title}
                </p>
                {article.description && (
                  <p className="text-[10px] text-fg-subtle leading-snug mt-0.5 line-clamp-1">
                    {article.description}
                  </p>
                )}
              </div>
            </div>

            {/* Extract */}
            <p className="text-[11px] text-fg-muted leading-relaxed line-clamp-2 flex-1">
              {article.extract}
            </p>

            {/* Actions row */}
            <div className="flex items-center justify-between flex-shrink-0">
              <a
                href={article.content_urls.desktop.page}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] transition-opacity hover:opacity-70"
                style={{ color: WIKI_ACCENT }}
              >
                {t('wikipedia.shortLink')}
              </a>
              <button
                onClick={() => setSeed(Date.now())}
                className="text-[10px] px-2 py-0.5 rounded-md font-medium transition-all hover:opacity-75"
                style={{
                  background: WIKI_ACCENT + '14',
                  color: WIKI_ACCENT,
                  border: `1px solid ${WIKI_ACCENT}22`,
                }}
              >
                {t('wikipedia.next')}
              </button>
            </div>

            {/* Auto-advance progress bar */}
            <div
              className="w-full rounded-full overflow-hidden flex-shrink-0"
              style={{ height: 2, background: 'rgba(255,255,255,0.05)' }}
            >
              <div
                className="h-full rounded-full"
                style={{ background: WIKI_ACCENT + '55', width: `${progress * 100}%` }}
              />
            </div>
          </motion.div>
        </AnimatePresence>
      ) : null}
    </div>
  )
}
