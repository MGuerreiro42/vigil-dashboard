import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WidgetShell } from '@/components/layout/widget-shell'
import { useRandomWikipedia } from '@/features/wikipedia/api/wikipedia'
import { WIKI_LANGUAGES } from '@/features/wikipedia/types'
import type { WikiSummary, WikiLangCode } from '@/features/wikipedia/types'
import { useAutoAdvance } from '@/hooks/use-auto-advance'
import { CompactCard } from './compact-card'
import { HistoryItem } from './history-item'
import { WikiLogo } from './wiki-logo'
import { ACCENT, formatDate, readingTime } from '@/features/wikipedia/lib/article-format'
import { useTranslation } from 'react-i18next'

const AUTO_ADVANCE_MS = 2 * 60 * 1000

export function WikipediaWidget({ isFocused = false }: { isFocused?: boolean }) {
  const { t, i18n } = useTranslation()

  // Start in the UI language when Wikipedia has it
  const [lang, setLang] = useState<WikiLangCode>(() => (i18n.resolvedLanguage === 'pt' ? 'pt' : 'en'))
  const [seed, setSeed] = useState(() => Date.now())
  const [history, setHistory] = useState<WikiSummary[]>([])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  const { data, isLoading, error, dataUpdatedAt } = useRandomWikipedia(lang, seed)

  // Accumulate unique articles into history (state adjusted during render, not in an effect)
  const [seenData, setSeenData] = useState(data)
  if (data !== seenData) {
    setSeenData(data)
    if (data && history[0]?.pageid !== data.pageid) {
      setHistory([data, ...history.slice(0, 14)])
      setHistoryIndex(0)
    }
  }

  const getNext = useCallback(() => {
    setSeed((current) => current + 1)
  }, [])

  const progress = useAutoAdvance(AUTO_ADVANCE_MS, seed, getNext, paused)

  const currentArticle = history[historyIndex]

  function switchLang(code: WikiLangCode) {
    setLang(code)
    setSeed((current) => current + 1)
  }

  return (
    <WidgetShell
      title="Wikipedia"
      icon={<WikiLogo size={isFocused ? 18 : 13} />}
      isLoading={isLoading && history.length === 0}
      error={error}
      onRetry={getNext}
      lastUpdated={dataUpdatedAt || undefined}
      accentColor={ACCENT}
      isFocused={isFocused}
      fillHeight={isFocused}
    >
      {/* ── Progress bar (auto-advance timer) ── */}
      <div className="w-full h-0.5 rounded-full bg-white/[0.05] mb-3 flex-shrink-0 overflow-hidden">
        <div
          className="h-full rounded-full transition-none"
          style={{ background: ACCENT + '70', width: `${progress * 100}%` }}
        />
      </div>

      {/* ══════════════════════════════════ COMPACT ══════════════════════════════════ */}
      {!isFocused && (
        <CompactCard
          article={currentArticle}
          onNext={getNext}
          isLoading={isLoading}
        />
      )}

      {/* ══════════════════════════════════ FOCUSED ══════════════════════════════════ */}
      {isFocused && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="flex gap-5 flex-1 min-h-0 p-5"
        >
          {/* ── Left: Article detail ── */}
          <div className="flex-1 min-w-0 flex flex-col gap-4 overflow-y-auto pr-2">
            {/* Controls: lang selector + playback */}
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              {WIKI_LANGUAGES.map((language) => (
                <button
                  key={language.code}
                  onClick={() => switchLang(language.code)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: lang === language.code ? ACCENT + '22' : 'rgba(255,255,255,0.04)',
                    color: lang === language.code ? ACCENT : 'rgba(255,255,255,0.32)',
                    border: `1px solid ${lang === language.code ? ACCENT + '48' : 'transparent'}`,
                  }}
                >
                  {language.label}
                </button>
              ))}
              <div className="flex-1" />
              <button
                onClick={() => setPaused((wasPaused) => !wasPaused)}
                title={paused ? t('wikipedia.resumeTitle') : t('wikipedia.pauseTitle')}
                className="px-2.5 py-1 rounded-lg text-xs transition-all text-fg-muted hover:text-white/60"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                {paused ? t('wikipedia.resume') : t('wikipedia.pause')}
              </button>
              <button
                onClick={getNext}
                className="px-3 py-1 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                style={{ background: ACCENT + '20', color: ACCENT, border: `1px solid ${ACCENT}3e` }}
              >
                {t('wikipedia.next')}
              </button>
            </div>

            {/* Article body — animated between articles */}
            <AnimatePresence mode="wait">
              {currentArticle ? (
                <motion.div
                  key={`${currentArticle.pageid}-${lang}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22 }}
                  className="flex flex-col gap-4"
                >
                  {/* Thumbnail */}
                  {currentArticle.thumbnail && (
                    <div
                      className="w-full rounded-xl overflow-hidden flex-shrink-0"
                      style={{ maxHeight: 200 }}
                    >
                      <img
                        src={currentArticle.thumbnail.source}
                        alt={currentArticle.title}
                        className="w-full object-cover"
                        style={{ maxHeight: 200 }}
                      />
                    </div>
                  )}

                  {/* Title + description */}
                  <div>
                    <h2 className="text-2xl font-bold text-white/95 leading-tight">
                      {currentArticle.title}
                    </h2>
                    {currentArticle.description && (
                      <p className="text-sm text-fg-muted mt-1">{currentArticle.description}</p>
                    )}
                  </div>

                  {/* Extract */}
                  <p className="text-[13.5px] text-white/68 leading-relaxed">
                    {currentArticle.extract}
                  </p>

                  {/* Metadata pills */}
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[11px] text-fg-subtle">
                      🕐 {formatDate(currentArticle.timestamp)}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[11px] text-fg-subtle">
                      {t('wikipedia.readingTime', { minutes: readingTime(currentArticle.extract) })}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[11px] text-fg-subtle uppercase tracking-wider">
                      {currentArticle.lang}
                    </span>
                    {currentArticle.coordinates && (
                      <span
                        className="px-2.5 py-1 rounded-lg text-[11px]"
                        style={{
                          background: ACCENT + '10',
                          border: `1px solid ${ACCENT}28`,
                          color: ACCENT,
                        }}
                      >
                        📍 {currentArticle.coordinates.lat.toFixed(3)}°,{' '}
                        {currentArticle.coordinates.lon.toFixed(3)}°
                      </span>
                    )}
                  </div>

                  {/* CTA */}
                  <a
                    href={currentArticle.content_urls.desktop.page}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="self-start inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                    style={{
                      background: ACCENT + '1e',
                      color: ACCENT,
                      border: `1px solid ${ACCENT}3a`,
                    }}
                  >
                    {t('wikipedia.readFull')}
                  </a>

                  {/* Auto-advance progress bar */}
                  <div className="w-full h-0.5 rounded-full bg-white/[0.05] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ background: ACCENT + '55', width: `${progress * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-fg-subtle -mt-3">
                    {paused
                      ? t('wikipedia.paused')
                      : t('wikipedia.nextIn', { minutes: Math.ceil((1 - progress) * (AUTO_ADVANCE_MS / 1000 / 60)) })}
                  </p>
                </motion.div>
              ) : (
                /* Loading skeleton */
                <div className="flex flex-col gap-4 animate-pulse">
                  <div className="w-full rounded-xl bg-white/5" style={{ height: 180 }} />
                  <div className="h-7 bg-white/5 rounded w-2/3" />
                  <div className="h-4 bg-white/5 rounded w-1/3" />
                  <div className="flex flex-col gap-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-3 bg-white/5 rounded" />
                    ))}
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Divider ── */}
          <div className="w-px bg-white/[0.06] flex-shrink-0" />

          {/* ── Right: History ── */}
          <div className="w-60 flex-shrink-0 flex flex-col min-h-0">
            <p className="text-[10px] uppercase tracking-widest text-fg-subtle mb-3 flex-shrink-0">
              {t('wikipedia.discovered')}
            </p>
            <div className="flex-1 overflow-y-auto flex flex-col gap-0.5 min-h-0">
              {history.map((article, i) => (
                <HistoryItem
                  key={article.pageid}
                  article={article}
                  index={i}
                  isActive={i === historyIndex}
                  onClick={() => setHistoryIndex(i)}
                />
              ))}
              {history.length === 0 && (
                <p className="text-xs text-fg-subtle text-center py-10">{t('common.loading')}</p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </WidgetShell>
  )
}
