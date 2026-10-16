import { useState, useMemo, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { generateDailyBrief, type BriefInsight } from '@/engine/brief'
import { GlassCard } from '@/components/surfaces/GlassCard'
import { useRandomWikipedia } from '@/api/wikipedia'
import { useAutoAdvance } from '@/hooks/useAutoAdvance'
import type { CryptoAsset } from '@/api/types/crypto'
import type { WeatherCurrent, ForecastDay } from '@/api/types/weather'
import type { AirQuality } from '@/api/types/air'
import type { Earthquake } from '@/api/types/earthquake'
import type { GithubRepo } from '@/api/types/github'

interface Props {
  crypto?: CryptoAsset[]
  weather?: WeatherCurrent
  forecast?: ForecastDay[]
  airQuality?: AirQuality | null
  earthquakes?: Earthquake[]
  githubTrending?: GithubRepo[]
}

const WIKI_ACCENT = '#a78bfa'
const WIKI_AUTO_MS = 3 * 60 * 1000

// ─── Wiki Discover card (right panel of hero) ─────────────────────────────────
function WikiDiscoverCard() {
  const navigate = useNavigate()
  const [seed, setSeed] = useState(() => Date.now())
  const { data: article, isLoading } = useRandomWikipedia('en', seed)
  const progress = useAutoAdvance(WIKI_AUTO_MS, seed, () => setSeed((s) => s + 1))

  return (
    <div className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-2.5 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="font-serif font-black leading-none" style={{ fontSize: 14, color: WIKI_ACCENT }}>W</span>
          <span className="text-[10px] uppercase tracking-widest text-white/25">Descobrir</span>
        </div>
        <button
          onClick={() => navigate('/wikipedia')}
          className="text-[10px] text-white/22 hover:text-white/50 transition-colors"
        >
          expandir ↗
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
                    <span className="font-serif font-bold text-white/20 text-sm">W</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-white/88 leading-snug line-clamp-2">
                  {article.title}
                </p>
                {article.description && (
                  <p className="text-[10px] text-white/32 leading-snug mt-0.5 line-clamp-1">
                    {article.description}
                  </p>
                )}
              </div>
            </div>

            {/* Extract */}
            <p className="text-[11px] text-white/45 leading-relaxed line-clamp-2 flex-1">
              {article.extract}
            </p>

            {/* Actions row */}
            <div className="flex items-center justify-between flex-shrink-0">
              <a
                href={article.content_urls.desktop.page}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] transition-opacity hover:opacity-70"
                style={{ color: WIKI_ACCENT + '78' }}
              >
                wikipedia ↗
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
                Next →
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

const CATEGORY_ICONS: Record<string, string> = {
  crypto: '₿', weather: '🌤', seismic: '🌍', air: '💨', tech: '💻',
}

const SEVERITY_COLORS: Record<string, string> = {
  info: '#22d3ee', warning: '#f59e0b', alert: '#f43f5e',
}

const SEVERITY_LABELS: Record<string, string> = {
  info: 'Info', warning: 'Atenção', alert: 'Alerta',
}

// Insight card — cards de alerta/warning são maiores e mais proeminentes
function InsightCard({ insight, index }: { insight: BriefInsight; index: number }) {
  const color = SEVERITY_COLORS[insight.severity]
  const icon = CATEGORY_ICONS[insight.category]
  const isUrgent = insight.severity !== 'info'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.07, type: 'spring', stiffness: 320, damping: 28 }}
      className={`relative flex-shrink-0 rounded-xl overflow-hidden ${isUrgent ? 'min-w-[220px] max-w-[260px]' : 'min-w-[190px] max-w-[230px]'}`}
      style={{
        background: isUrgent
          ? `linear-gradient(135deg, ${color}18, ${color}08)`
          : 'rgba(255,255,255,0.04)',
        border: `1px solid ${color}${isUrgent ? '35' : '18'}`,
        boxShadow: isUrgent ? `0 0 24px ${color}12` : 'none',
      }}
    >
      {/* Top accent bar — hierarquia visual: urgentes têm barra mais espessa */}
      <div
        className="absolute top-0 inset-x-0"
        style={{
          height: isUrgent ? '2px' : '1px',
          background: `linear-gradient(90deg, ${color}, transparent)`,
          opacity: isUrgent ? 1 : 0.5,
        }}
      />

      <div className="px-3 py-3">
        {/* Header do card */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className={isUrgent ? 'text-base' : 'text-sm'}>{icon}</span>
            <span
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color }}
            >
              {SEVERITY_LABELS[insight.severity]}
            </span>
          </div>
          {/* Pulse dot apenas em alertas */}
          {isUrgent && (
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
              className="w-2 h-2 rounded-full"
              style={{ background: color, boxShadow: `0 0 6px ${color}` }}
            />
          )}
        </div>

        {/* Headline — fonte maior em urgentes (Gestalt: figura-fundo, contraste) */}
        <p
          className={`font-semibold leading-snug ${isUrgent ? 'text-sm text-white/92' : 'text-[13px] text-white/75'}`}
        >
          {insight.headline}
        </p>

        {/* Detail — secundário, menor */}
        <p className="text-[11px] text-white/40 mt-1.5 leading-relaxed line-clamp-2">
          {insight.detail}
        </p>

        {/* Sources — mínimo, só para referência */}
        <div className="flex gap-1 mt-2 flex-wrap">
          {insight.dataSource.map((src) => (
            <span
              key={src}
              className="text-[10px] px-1.5 py-px rounded-sm"
              style={{ background: `${color}12`, color: `${color}80` }}
            >
              {src}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

export const DailyBrief = memo(function DailyBrief({ crypto, weather, forecast, airQuality, earthquakes, githubTrending }: Props) {
  const insights = useMemo(
    () => generateDailyBrief({ crypto, weather, forecast, airQuality, earthquakes, githubTrending }),
    [crypto, weather, forecast, airQuality, earthquakes, githubTrending]
  )

  // Ordenar: alertas → warnings → info (Gestalt: proximidade e ordem)
  const sorted = useMemo(
    () => [...insights].sort((a, b) => {
      const order = { alert: 0, warning: 1, info: 2 }
      return order[a.severity] - order[b.severity]
    }),
    [insights]
  )

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  const alertCount = insights.filter((i) => i.severity === 'alert').length
  const warnCount = insights.filter((i) => i.severity === 'warning').length

  return (
    <GlassCard className="w-full" variant="default">
      <div className="px-4 md:px-5 pt-4 md:pt-5 pb-3 md:pb-4 flex flex-col lg:flex-row gap-4 lg:gap-5 items-stretch">

        {/* ── Left: greeting + insight cards ── */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between mb-3 md:mb-4">
            <div className="flex items-start gap-3 md:gap-4 flex-wrap">
              {/* Saudação */}
              <div>
                <motion.h2
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                  className="text-xl md:text-2xl font-semibold tracking-tight"
                  style={{
                    background: 'linear-gradient(90deg, rgba(255,255,255,0.95), rgba(255,255,255,0.55))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {greeting}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-xs md:text-sm text-white/40 mt-0.5 capitalize"
                >
                  {now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </motion.p>
              </div>

              {/* Divisor vertical — só em sm+ */}
              <div className="hidden sm:block w-px self-stretch bg-white/8 mx-1" />

              {/* Status sumário */}
              <div className="flex items-center gap-2 md:gap-3 self-center flex-wrap">
                <span className="text-xs md:text-sm font-medium text-white/50">Vigil Brief</span>
                {alertCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: '#f43f5e22', color: '#f43f5e', border: '1px solid #f43f5e40' }}
                  >
                    {alertCount} alerta{alertCount > 1 ? 's' : ''}
                  </motion.span>
                )}
                {warnCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.05 }}
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: '#f59e0b22', color: '#f59e0b', border: '1px solid #f59e0b40' }}
                  >
                    {warnCount} aviso{warnCount > 1 ? 's' : ''}
                  </motion.span>
                )}
                {alertCount === 0 && warnCount === 0 && (
                  <span className="text-xs text-white/30">{insights.length} insights · tudo normal</span>
                )}
              </div>
            </div>

            {/* Timestamp */}
            <span className="text-xs text-white/20 self-start tabular-nums">
              {now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Insight cards */}
          <div className="flex gap-2 md:gap-2.5 overflow-x-auto pb-1 -mx-1 px-1">
            <AnimatePresence>
              {sorted.map((insight, i) => (
                <InsightCard key={insight.id} insight={insight} index={i} />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Divider — horizontal on mobile, vertical on lg ── */}
        <div className="lg:w-px lg:self-stretch w-full h-px bg-white/[0.07] flex-shrink-0" />

        {/* ── Right: Wikipedia discover — collapsible on mobile ── */}
        <WikiDiscoverCard />

      </div>
    </GlassCard>
  )
})
