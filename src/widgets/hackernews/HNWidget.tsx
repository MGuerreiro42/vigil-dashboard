import { useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { WidgetShell } from '@/components/layout/WidgetShell'
import { useTopStories } from '@/api/hackernews'
import { formatRelativeTime } from '@/hooks/useRelativeTime'

import type { HNStoryType } from '@/api/types/hackernews'

const ACCENT = '#f97316'

type SortOrder = 'score' | 'recent' | 'comments'
type RightTab = 'story' | 'analysis'

const TYPE_LABELS: Record<HNStoryType, { label: string; color: string }> = {
  story: { label: 'Story',   color: '#f97316' },
  ask:   { label: 'Ask HN',  color: '#22d3ee' },
  show:  { label: 'Show HN', color: '#10b981' },
  job:   { label: 'Job',     color: '#a855f7' },
}

function scoreColor(score: number): string {
  if (score >= 400) return '#f59e0b'
  if (score >= 200) return '#f97316'
  return 'rgba(255,255,255,0.4)'
}

function getDomain(url: string | null): string | null {
  if (!url) return null
  try { return new URL(url).hostname.replace('www.', '') } catch { return null }
}

export function HNWidget({ isFocused = false }: { isFocused?: boolean }) {

  const [sortOrder, setSortOrder] = useState<SortOrder>('score')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [rightTab, setRightTab] = useState<RightTab>('story')

  const { data: stories, isLoading, error, refetch, dataUpdatedAt } = useTopStories(30)

  const topStory = stories?.reduce((a, b) => b.score > a.score ? b : a, stories[0])
  const avgScore = stories?.length
    ? Math.round(stories.reduce((s, st) => s + st.score, 0) / stories.length)
    : 0
  const totalComments = stories?.reduce((s, st) => s + st.descendants, 0) ?? 0

  const sortedStories = [...(stories ?? [])].sort((a, b) => {
    if (sortOrder === 'recent')   return b.time - a.time
    if (sortOrder === 'comments') return b.descendants - a.descendants
    return b.score - a.score
  })

  const selectedStory = stories?.find((s) => s.id === selectedId) ?? null

  const scoreBuckets = [
    { range: '0–99',    min: 0,   max: 99   },
    { range: '100–199', min: 100, max: 199  },
    { range: '200–299', min: 200, max: 299  },
    { range: '300–499', min: 300, max: 499  },
    { range: '500+',    min: 500, max: Infinity },
  ]
  const scoreDistribution = scoreBuckets.map((b) => ({
    range: b.range,
    count: stories?.filter((s) => s.score >= b.min && s.score <= b.max).length ?? 0,
  }))

  const typeCounts = Object.entries(TYPE_LABELS).map(([type, info]) => ({
    type: type as HNStoryType,
    label: info.label,
    color: info.color,
    count: stories?.filter((s) => s.type === type).length ?? 0,
  }))

  const tabs: { id: RightTab; label: string }[] = [
    { id: 'story',    label: 'Story' },
    { id: 'analysis', label: 'Análise' },
  ]

  const HNIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M0 0h24v24H0V0zm12.6 14.4L8.4 6H6l5.4 10.2v5.4h1.2v-5.4L18 6h-2.4l-3 8.4z"/>
    </svg>
  )

  return (
    <WidgetShell
      id="hackernews"
      title="Hacker News"
      icon={<HNIcon size={isFocused ? 20 : 14} />}
      isLoading={isLoading}
      error={error}
      onRetry={() => refetch()}
      lastUpdated={dataUpdatedAt || undefined}
      accentColor={ACCENT}
      isFocused={isFocused}
      fillHeight={isFocused}
    >
      {/* ── Stats header ── */}
      {stories && (
        <div className="flex gap-2 mb-3 flex-shrink-0">
          <div className="flex flex-col justify-between px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] min-w-[68px]">
            <span className="text-[10px] uppercase tracking-widest text-white/25 leading-none">Stories</span>
            <span className="text-[22px] font-mono font-bold text-white/85 leading-none mt-1.5">{stories.length}</span>
            <span className="text-[10px] text-white/20 mt-1 leading-none">top</span>
          </div>

          {topStory && (
            <div className="flex flex-col justify-between px-3 py-2.5 rounded-xl border min-w-[68px] flex-1"
              style={{ background: ACCENT + '0d', borderColor: ACCENT + '35' }}>
              <span className="text-[10px] uppercase tracking-widest leading-none" style={{ color: ACCENT + 'aa' }}>Top Score</span>
              <span className="text-[22px] font-mono font-bold leading-none mt-1.5" style={{ color: ACCENT }}>
                {topStory.score >= 1000 ? `${(topStory.score / 1000).toFixed(1)}k` : topStory.score}
              </span>
              <span className="text-[10px] mt-1 leading-none truncate" style={{ color: ACCENT + '70' }}>
                {topStory.title.slice(0, 30)}…
              </span>
            </div>
          )}

          <div className="flex flex-col justify-between px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] min-w-[68px]">
            <span className="text-[10px] uppercase tracking-widest text-white/25 leading-none">Score Médio</span>
            <span className="text-[22px] font-mono font-bold text-white/85 leading-none mt-1.5">{avgScore}</span>
            <span className="text-[10px] text-white/20 mt-1 leading-none">médio</span>
          </div>

          <div className="flex flex-col justify-between px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] min-w-[68px]">
            <span className="text-[10px] uppercase tracking-widest text-white/25 leading-none">💬 Comentários</span>
            <span className="text-[22px] font-mono font-bold text-white/85 leading-none mt-1.5">
              {totalComments >= 1000 ? `${(totalComments / 1000).toFixed(1)}k` : totalComments}
            </span>
            <span className="text-[10px] text-white/20 mt-1 leading-none">total</span>
          </div>
        </div>
      )}

      {/* ── MODO COMPACTO ── */}
      {!isFocused && (
        <div className="flex flex-col gap-0.5">
          {stories?.slice(0, 12).map((story, i) => {
            const typeInfo = TYPE_LABELS[story.type] ?? TYPE_LABELS.story
            const domain = getDomain(story.url)
            return (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03, type: 'spring', stiffness: 300, damping: 30 }}
                className="flex gap-2 py-1.5 px-2 rounded-lg hover:bg-white/4 transition-colors"
              >
                <div className="flex flex-col items-center w-8 flex-shrink-0 pt-0.5">
                  <span className="text-xs font-mono font-semibold" style={{ color: scoreColor(story.score) }}>
                    {story.score >= 1000 ? `${(story.score/1000).toFixed(1)}k` : story.score}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <a href={story.url ?? `https://news.ycombinator.com/item?id=${story.id}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-[13px] font-medium text-white/78 hover:text-white/95 leading-snug line-clamp-2">
                    {story.title}
                  </a>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {story.type !== 'story' && (
                      <span className="text-[11px] px-1.5 py-px rounded-sm font-medium"
                        style={{ color: typeInfo.color, background: typeInfo.color + '18' }}>
                        {typeInfo.label}
                      </span>
                    )}
                    {domain && <span className="text-[11px] text-white/25 truncate max-w-[100px]">{domain}</span>}
                    <span className="text-[11px] text-white/25">{formatRelativeTime(story.time)}</span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* ── MODO EXPANDIDO: tiling ── */}
      {isFocused && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="flex gap-4 flex-1 min-h-0"
        >
          {/* Coluna esquerda */}
          <div className="w-64 flex-shrink-0 flex flex-col min-h-0">
            <div className="flex gap-1 mb-2 flex-shrink-0">
              {([
                { id: 'score',    label: 'Score↓' },
                { id: 'recent',   label: 'Recente' },
                { id: 'comments', label: 'Coment.↓' },
              ] as { id: SortOrder; label: string }[]).map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSortOrder(opt.id)}
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium transition-all"
                  style={{
                    background: sortOrder === opt.id ? 'rgba(255,255,255,0.08)' : 'transparent',
                    color: sortOrder === opt.id ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.28)',
                    border: `1px solid ${sortOrder === opt.id ? 'rgba(255,255,255,0.12)' : 'transparent'}`,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-0.5 overflow-y-auto flex-1 min-h-0 pr-0.5">
              {sortedStories.map((story, i) => {
                const isSelected = selectedId === story.id
                const domain = getDomain(story.url)
                return (
                  <motion.div
                    key={story.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.018, 0.25) }}
                    onClick={() => { setSelectedId(story.id); setRightTab('story') }}
                    className="flex items-start gap-2 py-1.5 px-2 rounded-lg transition-colors cursor-pointer hover:bg-white/4 flex-shrink-0"
                    style={{
                      background: isSelected ? ACCENT + '14' : undefined,
                      outline: isSelected ? `1px solid ${ACCENT}38` : 'none',
                    }}
                  >
                    <div className="flex flex-col items-center w-8 flex-shrink-0 pt-0.5">
                      <span className="text-xs font-mono font-semibold" style={{ color: scoreColor(story.score) }}>
                        {story.score >= 1000 ? `${(story.score/1000).toFixed(1)}k` : story.score}
                      </span>
                      <span className="text-[10px] text-white/20">pts</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] text-white/70 leading-tight line-clamp-2">{story.title}</div>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        {domain && <span className="text-[11px] text-white/25 truncate max-w-[80px]">{domain}</span>}
                        <span className="text-[11px] text-white/20">{formatRelativeTime(story.time)}</span>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Divisor */}
          <div className="w-px bg-white/6 flex-shrink-0" />

          {/* Coluna direita */}
          <div className="flex-1 min-w-0 flex flex-col gap-3">
            <div className="flex gap-1 flex-shrink-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setRightTab(tab.id)}
                  className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: rightTab === tab.id ? ACCENT + '20' : 'transparent',
                    color: rightTab === tab.id ? ACCENT : 'rgba(255,255,255,0.35)',
                    border: `1px solid ${rightTab === tab.id ? ACCENT + '50' : 'transparent'}`,
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 min-h-0" style={{ position: 'relative' }}>
              {/* Tab: Story */}
              <div style={{
                position: 'absolute', inset: 0,
                opacity: rightTab === 'story' ? 1 : 0,
                pointerEvents: rightTab === 'story' ? 'auto' : 'none',
                transition: 'opacity 0.2s ease',
                overflowY: 'auto',
              }}>
                {selectedStory ? (() => {
                  const typeInfo = TYPE_LABELS[selectedStory.type] ?? TYPE_LABELS.story
                  const domain = getDomain(selectedStory.url)
                  return (
                    <div style={{ background: '#06080f', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', padding: 16 }}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-3xl font-mono font-bold" style={{ color: scoreColor(selectedStory.score) }}>
                          {selectedStory.score >= 1000 ? `${(selectedStory.score/1000).toFixed(1)}k` : selectedStory.score}
                        </span>
                        <span className="text-[12px] px-2 py-0.5 rounded-full font-medium"
                          style={{ color: typeInfo.color, background: typeInfo.color + '20', border: `1px solid ${typeInfo.color}40` }}>
                          {typeInfo.label}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-white/90 leading-snug mb-3">{selectedStory.title}</h3>
                      <div className="flex items-center gap-2 text-[12px] text-white/40 mb-4 flex-wrap">
                        <span>por {selectedStory.by}</span>
                        <span>·</span>
                        <span>{formatRelativeTime(selectedStory.time)}</span>
                        {domain && (
                          <>
                            <span>·</span>
                            <span className="px-1.5 py-px rounded bg-white/5">{domain}</span>
                          </>
                        )}
                      </div>
                      <div className="flex gap-3 mb-4">
                        <div className="flex flex-col justify-between px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                          <span className="text-[10px] text-white/25">Score</span>
                          <span className="text-lg font-mono font-bold" style={{ color: scoreColor(selectedStory.score) }}>
                            {selectedStory.score}
                          </span>
                          <span className="text-[10px] text-white/20">pts</span>
                        </div>
                        <div className="flex flex-col justify-between px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                          <span className="text-[10px] text-white/25">💬</span>
                          <span className="text-lg font-mono font-bold text-white/80">{selectedStory.descendants}</span>
                          <span className="text-[10px] text-white/20">coments.</span>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {selectedStory.url && (
                          <a href={selectedStory.url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                            style={{ background: ACCENT + '20', color: ACCENT, border: `1px solid ${ACCENT}40` }}>
                            Ler artigo ↗
                          </a>
                        )}
                        <a href={`https://news.ycombinator.com/item?id=${selectedStory.id}`}
                          target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
                          Ver no HN ↗
                        </a>
                      </div>
                    </div>
                  )
                })() : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-white/25">Selecione uma história</p>
                  </div>
                )}
              </div>

              {/* Tab: Análise */}
              <div style={{
                position: 'absolute', inset: 0,
                opacity: rightTab === 'analysis' ? 1 : 0,
                pointerEvents: rightTab === 'analysis' ? 'auto' : 'none',
                transition: 'opacity 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}>
                <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: '#06080f',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.06)',
                    backgroundImage: [
                      'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
                      'linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                    ].join(','),
                    backgroundSize: '48px 48px',
                    overflow: 'hidden',
                  }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={scoreDistribution} margin={{ top: 16, right: 16, left: -16, bottom: 8 }}>
                        <XAxis dataKey="range" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ background: 'rgba(13,17,23,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                          formatter={(v) => [Number(v), 'Stories']}
                          labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                        />
                        <Bar dataKey="count" fill={ACCENT} fillOpacity={0.7} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <p className="text-[10px] text-white/30 uppercase tracking-widest flex-shrink-0">Distribuição de Pontuações</p>
                <div className="flex gap-2 flex-wrap flex-shrink-0">
                  {typeCounts.map(({ label, color, count }) => (
                    <div key={label} className="flex flex-col justify-between px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] min-w-[60px]">
                      <span className="text-[10px] uppercase tracking-widest text-white/25 leading-none">{label}</span>
                      <span className="text-lg font-mono font-bold leading-none mt-1" style={{ color }}>{count}</span>
                    </div>
                  ))}
                  <div className="flex flex-col justify-between px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] min-w-[60px]">
                    <span className="text-[10px] uppercase tracking-widest text-white/25 leading-none">Médio</span>
                    <span className="text-lg font-mono font-bold leading-none mt-1 text-white/75">{avgScore}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </WidgetShell>
  )
}
