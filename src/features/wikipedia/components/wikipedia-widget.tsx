import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WidgetShell } from '@/components/layout/widget-shell'
import { useRandomWikipedia } from '@/features/wikipedia/api/wikipedia'
import { WIKI_LANGUAGES } from '@/features/wikipedia/types'
import type { WikiSummary, WikiLangCode } from '@/features/wikipedia/types'
import { useAutoAdvance } from '@/hooks/use-auto-advance'

const ACCENT = '#a78bfa'

function WikiW({ size }: { size: number }) {
  return (
    <span
      className="font-serif font-black leading-none select-none"
      style={{ fontSize: size, color: ACCENT }}
    >
      W
    </span>
  )
}
const AUTO_ADVANCE_MS = 2 * 60 * 1000

function readingTime(text: string): number {
  return Math.max(1, Math.ceil(text.split(' ').length / 200))
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// ─── Thumbnail placeholder ──────────────────────────────────────────────────
function WikiThumb({
  src,
  alt,
  className,
}: {
  src?: string
  alt?: string
  className?: string
}) {
  return src ? (
    <img src={src} alt={alt ?? ''} className={`object-cover ${className ?? ''}`} />
  ) : (
    <div
      className={`flex items-center justify-center ${className ?? ''}`}
      style={{
        background:
          'linear-gradient(135deg, rgba(167,139,250,0.12) 0%, rgba(167,139,250,0.04) 100%)',
      }}
    >
      <span className="font-serif font-bold text-white/15 select-none" style={{ fontSize: 28 }}>
        W
      </span>
    </div>
  )
}

// ─── Compact article card ────────────────────────────────────────────────────
function CompactCard({
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

// ─── History sidebar item ────────────────────────────────────────────────────
function HistoryItem({
  article,
  index,
  isActive,
  onClick,
}: {
  article: WikiSummary
  index: number
  isActive: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={onClick}
      className="flex gap-2 p-2 rounded-lg text-left w-full transition-colors hover:bg-white/[0.04] flex-shrink-0"
      style={{
        background: isActive ? ACCENT + '12' : undefined,
        outline: isActive ? `1px solid ${ACCENT}35` : 'none',
      }}
    >
      <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0">
        <WikiThumb
          src={article.thumbnail?.source}
          alt=""
          className="w-full h-full"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-medium text-white/78 leading-tight line-clamp-1">
          {article.title}
        </div>
        {article.description && (
          <div className="text-[11px] text-white/32 leading-tight line-clamp-1 mt-0.5">
            {article.description}
          </div>
        )}
      </div>
    </motion.button>
  )
}

// ─── Main widget ─────────────────────────────────────────────────────────────
export function WikipediaWidget({ isFocused = false }: { isFocused?: boolean }) {

  const [lang, setLang] = useState<WikiLangCode>('en')
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
      icon={<WikiW size={isFocused ? 18 : 13} />}
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
              {WIKI_LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => switchLang(l.code)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: lang === l.code ? ACCENT + '22' : 'rgba(255,255,255,0.04)',
                    color: lang === l.code ? ACCENT : 'rgba(255,255,255,0.32)',
                    border: `1px solid ${lang === l.code ? ACCENT + '48' : 'transparent'}`,
                  }}
                >
                  {l.label}
                </button>
              ))}
              <div className="flex-1" />
              <button
                onClick={() => setPaused((p) => !p)}
                title={paused ? 'Resume auto-advance' : 'Pause auto-advance'}
                className="px-2.5 py-1 rounded-lg text-xs transition-all text-white/35 hover:text-white/60"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                {paused ? '▶ Auto' : '⏸ Pause'}
              </button>
              <button
                onClick={getNext}
                className="px-3 py-1 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                style={{ background: ACCENT + '20', color: ACCENT, border: `1px solid ${ACCENT}3e` }}
              >
                Next →
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
                      <p className="text-sm text-white/42 mt-1">{currentArticle.description}</p>
                    )}
                  </div>

                  {/* Extract */}
                  <p className="text-[13.5px] text-white/68 leading-relaxed">
                    {currentArticle.extract}
                  </p>

                  {/* Metadata pills */}
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[11px] text-white/32">
                      🕐 {formatDate(currentArticle.timestamp)}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[11px] text-white/32">
                      📖 ~{readingTime(currentArticle.extract)} min read
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[11px] text-white/32 uppercase tracking-wider">
                      {currentArticle.lang}
                    </span>
                    {currentArticle.coordinates && (
                      <span
                        className="px-2.5 py-1 rounded-lg text-[11px]"
                        style={{
                          background: ACCENT + '10',
                          border: `1px solid ${ACCENT}28`,
                          color: ACCENT + 'a0',
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
                    Read full article on Wikipedia ↗
                  </a>

                  {/* Auto-advance progress bar */}
                  <div className="w-full h-0.5 rounded-full bg-white/[0.05] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ background: ACCENT + '55', width: `${progress * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-white/20 -mt-3">
                    {paused
                      ? 'Auto-advance paused'
                      : `Next article in ~${Math.ceil((1 - progress) * (AUTO_ADVANCE_MS / 1000 / 60))} min`}
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
            <p className="text-[10px] uppercase tracking-widest text-white/22 mb-3 flex-shrink-0">
              Discovered
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
                <p className="text-xs text-white/20 text-center py-10">Loading…</p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </WidgetShell>
  )
}
