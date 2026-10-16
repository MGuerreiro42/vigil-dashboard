import { useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { WidgetShell } from '@/components/layout/widget-shell'
import { useTrendingRepos } from '@/features/github/api/github'

const ACCENT = '#a855f7'

type SortOrder = 'stars-desc' | 'stars-asc' | 'forks' | 'name'
type RightTab = 'repo' | 'languages' | 'analysis'

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572a5',
  Rust: '#dea584', Go: '#00add8', Java: '#b07219', 'C++': '#f34b7d',
  C: '#555555', Swift: '#f05138', Kotlin: '#a97bff', Ruby: '#701516',
  PHP: '#4f5d95', Dart: '#00b4ab', Zig: '#ec915c', Vue: '#41b883',
}

function formatStars(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function LangBadge({ lang }: { lang: string | null }) {
  if (!lang) return null
  const color = LANG_COLORS[lang] ?? '#8b8fa8'
  return (
    <span className="flex items-center gap-1 text-[11px] text-white/50">
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
      {lang}
    </span>
  )
}

function GithubIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  )
}

export function GithubWidget({ isFocused = false }: { isFocused?: boolean }) {
  const [selectedLangFilter, setSelectedLangFilter] = useState<string | undefined>()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder>('stars-desc')
  const [rightTab, setRightTab] = useState<RightTab>('repo')


  const { data: repos, isLoading, error, refetch, dataUpdatedAt } = useTrendingRepos(selectedLangFilter)

  const languages = repos
    ? Array.from(new Set(repos.map((r) => r.language).filter(Boolean) as string[])).slice(0, 8)
    : []

  const totalStars = repos?.reduce((s, r) => s + r.stars, 0) ?? 0
  const totalForks = repos?.reduce((s, r) => s + r.forks, 0) ?? 0

  const langCount: Record<string, number> = {}
  repos?.forEach((r) => { if (r.language) langCount[r.language] = (langCount[r.language] ?? 0) + 1 })
  const dominantLang = Object.entries(langCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'

  const sortedRepos = [...(repos ?? [])].sort((a, b) => {
    if (sortOrder === 'stars-asc') return a.stars - b.stars
    if (sortOrder === 'forks')     return b.forks - a.forks
    if (sortOrder === 'name')      return a.name.localeCompare(b.name)
    return b.stars - a.stars
  })

  const selectedRepo = repos?.find((r) => r.id === selectedId) ?? null

  const langStars = languages.map((lang) => ({
    lang,
    stars: repos?.filter((r) => r.language === lang).reduce((s, r) => s + r.stars, 0) ?? 0,
    color: LANG_COLORS[lang] ?? '#8b8fa8',
  })).sort((a, b) => b.stars - a.stars)

  // Stars distribution for analysis
  const starBuckets = [
    { range: '0–100',  min: 0,    max: 100   },
    { range: '100–500',min: 100,  max: 500   },
    { range: '500–1k', min: 500,  max: 1000  },
    { range: '1k–5k',  min: 1000, max: 5000  },
    { range: '5k+',    min: 5000, max: Infinity },
  ]
  const starsDist = starBuckets.map((b) => ({
    range: b.range,
    count: repos?.filter((r) => r.stars >= b.min && r.stars < b.max).length ?? 0,
  }))

  const tabs: { id: RightTab; label: string }[] = [
    { id: 'repo',      label: 'Repo' },
    { id: 'languages', label: 'Linguagens' },
    { id: 'analysis',  label: 'Análise' },
  ]

  return (
    <WidgetShell
      title="GitHub Trending"
      icon={<GithubIcon size={isFocused ? 20 : 14} />}
      isLoading={isLoading}
      error={error}
      onRetry={() => refetch()}
      lastUpdated={dataUpdatedAt || undefined}
      accentColor={ACCENT}
      isFocused={isFocused}
      fillHeight={isFocused}
      viewRoute="/github"
    >
      {/* ── Stats header ── */}
      {repos && (
        <div className="flex gap-2 mb-3 flex-shrink-0">
          <div className="flex flex-col justify-between px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] min-w-[68px]">
            <span className="text-[10px] uppercase tracking-widest text-white/25 leading-none">Repos</span>
            <span className="text-[22px] font-mono font-bold text-white/85 leading-none mt-1.5">{repos.length}</span>
            <span className="text-[10px] text-white/20 mt-1 leading-none">trending</span>
          </div>
          <div className="flex flex-col justify-between px-3 py-2.5 rounded-xl border min-w-[68px]"
            style={{ background: ACCENT + '0d', borderColor: ACCENT + '35' }}>
            <span className="text-[10px] uppercase tracking-widest leading-none" style={{ color: ACCENT + 'aa' }}>⭐ Stars</span>
            <span className="text-[22px] font-mono font-bold leading-none mt-1.5" style={{ color: ACCENT }}>
              {formatStars(totalStars)}
            </span>
            <span className="text-[10px] mt-1 leading-none" style={{ color: ACCENT + '70' }}>no trending</span>
          </div>
          <div className="flex flex-col justify-between px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] min-w-[68px]">
            <span className="text-[10px] uppercase tracking-widest text-white/25 leading-none">Linguagem</span>
            <span className="text-[15px] font-mono font-bold text-white/85 leading-none mt-1.5 truncate">
              {dominantLang}
            </span>
            <span className="text-[10px] text-white/20 mt-1 leading-none">dominante</span>
          </div>
          <div className="flex flex-col justify-between px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] min-w-[68px]">
            <span className="text-[10px] uppercase tracking-widest text-white/25 leading-none">🍴 Forks</span>
            <span className="text-[22px] font-mono font-bold text-white/85 leading-none mt-1.5">
              {formatStars(totalForks)}
            </span>
            <span className="text-[10px] text-white/20 mt-1 leading-none">total</span>
          </div>
        </div>
      )}

      {/* ── MODO COMPACTO ── */}
      {!isFocused && (
        <div className="flex flex-col gap-1.5">
          {repos?.slice(0, 8).map((repo, i) => (
            <motion.a
              key={repo.id}
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="block p-2.5 rounded-lg hover:bg-white/4 transition-colors group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white/80 group-hover:text-white/95 transition-colors truncate">
                    {repo.name}
                  </div>
                  <div className="text-[11px] text-white/35 truncate mt-0.5">{repo.description}</div>
                </div>
                <span className="text-[11px] font-mono text-white/40 flex-shrink-0">⭐{formatStars(repo.stars)}</span>
              </div>
              <div className="flex gap-2 mt-1">
                <LangBadge lang={repo.language} />
              </div>
            </motion.a>
          ))}
        </div>
      )}

      {/* ── MODO EXPANDIDO: tiling ── */}
      {isFocused && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col md:flex-row gap-4 flex-1 min-h-0"
        >
          {/* Coluna esquerda */}
          <div className="w-full md:w-64 md:flex-shrink-0 flex flex-col md:min-h-0 min-h-[180px]">
            {/* Language filter chips */}
            {languages.length > 0 && (
              <div className="flex gap-1 flex-wrap mb-2 flex-shrink-0">
                <button
                  onClick={() => setSelectedLangFilter(undefined)}
                  className="text-[11px] px-2 py-0.5 rounded-full border transition-all"
                  style={{
                    borderColor: !selectedLangFilter ? ACCENT + '80' : 'rgba(255,255,255,0.1)',
                    color: !selectedLangFilter ? ACCENT : 'rgba(255,255,255,0.4)',
                    background: !selectedLangFilter ? ACCENT + '15' : 'transparent',
                  }}
                >
                  All
                </button>
                {languages.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLangFilter(lang === selectedLangFilter ? undefined : lang)}
                    className="text-[11px] px-2 py-0.5 rounded-full border transition-all"
                    style={{
                      borderColor: selectedLangFilter === lang ? ACCENT + '80' : 'rgba(255,255,255,0.1)',
                      color: selectedLangFilter === lang ? ACCENT : 'rgba(255,255,255,0.4)',
                      background: selectedLangFilter === lang ? ACCENT + '15' : 'transparent',
                    }}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            )}

            {/* Sort buttons */}
            <div className="flex gap-1 mb-2 flex-shrink-0">
              {([
                { id: 'stars-desc', label: 'Stars↓' },
                { id: 'stars-asc',  label: 'Stars↑' },
                { id: 'forks',      label: 'Forks↓' },
                { id: 'name',       label: 'Nome' },
              ] as { id: SortOrder; label: string }[]).map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSortOrder(opt.id)}
                  className="px-2 py-1 rounded-md text-[11px] font-medium transition-all"
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
              {sortedRepos.map((repo, i) => {
                const isSelected = selectedId === repo.id
                return (
                  <motion.div
                    key={repo.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.2) }}
                    onClick={() => { setSelectedId(repo.id); setRightTab('repo') }}
                    className="flex items-start gap-2 py-2 px-2 rounded-lg transition-colors cursor-pointer hover:bg-white/4 flex-shrink-0"
                    style={{
                      background: isSelected ? ACCENT + '14' : undefined,
                      outline: isSelected ? `1px solid ${ACCENT}38` : 'none',
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {repo.language && (
                          <span className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: LANG_COLORS[repo.language] ?? '#8b8fa8' }} />
                        )}
                        <span className="text-[12px] font-semibold text-white/80 truncate">{repo.name}</span>
                      </div>
                      <div className="text-[11px] text-white/30 truncate mt-0.5">{repo.fullName}</div>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                      <span className="text-[11px] font-mono text-white/50">⭐{formatStars(repo.stars)}</span>
                      {repo.forks > 0 && (
                        <span className="text-[11px] text-white/30">🍴{formatStars(repo.forks)}</span>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Divisor */}
          <div className="md:w-px md:h-auto h-px w-full bg-white/6 flex-shrink-0" />

          {/* Coluna direita */}
          <div className="flex-1 min-w-0 flex flex-col gap-3 min-h-[280px] md:min-h-0">
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
              {/* Tab: Repo */}
              <div style={{
                position: 'absolute', inset: 0,
                opacity: rightTab === 'repo' ? 1 : 0,
                pointerEvents: rightTab === 'repo' ? 'auto' : 'none',
                transition: 'opacity 0.2s ease',
                overflowY: 'auto',
              }}>
                {selectedRepo ? (
                  <div style={{ background: '#06080f', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', padding: 16 }}>
                    <div className="mb-3">
                      <div className="text-base font-bold text-white/90">{selectedRepo.name}</div>
                      <div className="text-[12px] text-white/35 mt-0.5">{selectedRepo.fullName}</div>
                    </div>
                    {selectedRepo.description && (
                      <p className="text-sm text-white/60 leading-relaxed mb-3">{selectedRepo.description}</p>
                    )}
                    {selectedRepo.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {selectedRepo.topics.map((topic) => (
                          <span key={topic} className="text-[11px] px-2 py-0.5 rounded-full"
                            style={{ background: ACCENT + '18', color: ACCENT + 'cc', border: `1px solid ${ACCENT}30` }}>
                            #{topic}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-[12px] text-white/60">⭐ {selectedRepo.stars.toLocaleString()}</span>
                      <span className="text-[12px] text-white/60">🍴 {selectedRepo.forks.toLocaleString()}</span>
                      <LangBadge lang={selectedRepo.language} />
                    </div>
                    <a
                      href={selectedRepo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{ background: ACCENT + '20', color: ACCENT, border: `1px solid ${ACCENT}40` }}
                    >
                      Abrir no GitHub ↗
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-white/25">Selecione um repositório</p>
                  </div>
                )}
              </div>

              {/* Tab: Linguagens */}
              <div style={{
                position: 'absolute', inset: 0,
                opacity: rightTab === 'languages' ? 1 : 0,
                pointerEvents: rightTab === 'languages' ? 'auto' : 'none',
                transition: 'opacity 0.2s ease',
              }}>
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
                    <BarChart data={langStars} layout="vertical" margin={{ top: 16, right: 24, left: -10, bottom: 8 }}>
                      <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false}
                        tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)} />
                      <YAxis type="category" dataKey="lang" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
                      <Tooltip
                        contentStyle={{ background: 'rgba(13,17,23,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                        formatter={(v) => [Number(v).toLocaleString(), 'Stars']}
                        labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                      />
                      <Bar dataKey="stars" radius={[0, 4, 4, 0]}>
                        {langStars.map((entry, i) => (
                          <Cell key={i} fill={entry.color} fillOpacity={0.75} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
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
                <div style={{ flex: 1, position: 'relative' }}>
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
                      <BarChart data={starsDist} margin={{ top: 16, right: 16, left: -16, bottom: 8 }}>
                        <XAxis dataKey="range" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ background: 'rgba(13,17,23,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                          formatter={(v) => [Number(v), 'Repos']}
                          labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                        />
                        <Bar dataKey="count" fill={ACCENT} fillOpacity={0.7} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <p className="text-[10px] text-white/30 uppercase tracking-widest flex-shrink-0">Distribuição de Stars</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </WidgetShell>
  )
}
