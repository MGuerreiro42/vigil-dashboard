import { useState } from 'react'
import { motion } from 'framer-motion'
import { WidgetShell } from '@/components/layout/widget-shell'
import { SegmentedTabs } from '@/components/ui/segmented-tabs'
import { tabPanel } from '@/components/ui/tab-panel'
import { useTrendingRepos } from '@/features/github/api/github'
import { GithubIcon } from './github-icon'
import { LangBadge } from './lang-badge'
import { LanguageStarsChart } from './language-stars-chart'
import { RepoDetail } from './repo-detail'
import { StarsDistributionChart } from './stars-distribution-chart'
import { ACCENT, LANG_COLORS, formatStars } from '@/features/github/lib/github-format'
import { StatTile } from '@/components/ui/stat-tile'
import { useTranslation } from 'react-i18next'

type SortOrder = 'stars-desc' | 'stars-asc' | 'forks' | 'name'
type RightTab = 'repo' | 'languages' | 'analysis'

export function GithubWidget({ isFocused = false }: { isFocused?: boolean }) {
  const { t } = useTranslation()
  const [selectedLangFilter, setSelectedLangFilter] = useState<string | undefined>()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder>('stars-desc')
  const [rightTab, setRightTab] = useState<RightTab>('repo')


  const { data: repos, isLoading, error, refetch, dataUpdatedAt } = useTrendingRepos(selectedLangFilter)

  const languages = repos
    ? Array.from(new Set(repos.map((repo) => repo.language).filter(Boolean) as string[])).slice(0, 8)
    : []

  const totalStars = repos?.reduce((total, repo) => total + repo.stars, 0) ?? 0
  const totalForks = repos?.reduce((total, repo) => total + repo.forks, 0) ?? 0

  const langCount: Record<string, number> = {}
  repos?.forEach((repo) => { if (repo.language) langCount[repo.language] = (langCount[repo.language] ?? 0) + 1 })
  const dominantLang = Object.entries(langCount).sort((first, second) => second[1] - first[1])[0]?.[0] ?? '—'

  const sortedRepos = [...(repos ?? [])].sort((first, second) => {
    if (sortOrder === 'stars-asc') return first.stars - second.stars
    if (sortOrder === 'forks')     return second.forks - first.forks
    if (sortOrder === 'name')      return first.name.localeCompare(second.name)
    return second.stars - first.stars
  })

  const selectedRepo = repos?.find((repo) => repo.id === selectedId) ?? null

  const tabs: { id: RightTab; label: string }[] = [
    { id: 'repo',      label: t('github.tabs.repo') },
    { id: 'languages', label: t('github.tabs.languages') },
    { id: 'analysis',  label: t('github.tabs.analysis') },
  ]

  return (
    <WidgetShell
      title={t('github.title')}
      icon={<GithubIcon size={isFocused ? 20 : 14} />}
      isLoading={isLoading}
      error={error}
      onRetry={() => refetch()}
      lastUpdated={dataUpdatedAt || undefined}
      accentColor={ACCENT}
      isFocused={isFocused}
      fillHeight={isFocused}
      viewRoute="/tech"
    >
      {/* ── Stats header ── */}
      {repos && (
        <div className="flex gap-2 mb-3 flex-shrink-0">
          <StatTile label={t('github.stats.repos')} value={repos.length} caption={t('github.stats.trending')} />
          <StatTile label={t('github.stats.stars')} value={formatStars(totalStars)} caption={t('github.stats.inTrending')} color={ACCENT} />
          <StatTile label={t('github.stats.language')} value={dominantLang} caption={t('github.stats.dominant')} valueClassName="text-[15px] font-mono font-bold truncate" />
          <StatTile label={t('github.stats.forks')} value={formatStars(totalForks)} caption={t('common.total')} />
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
                  <div className="text-[11px] text-fg-muted truncate mt-0.5">{repo.description}</div>
                </div>
                <span className="text-[11px] font-mono text-fg-muted flex-shrink-0">⭐{formatStars(repo.stars)}</span>
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
                    color: !selectedLangFilter ? ACCENT : 'rgba(255,255,255,0.62)',
                    background: !selectedLangFilter ? ACCENT + '15' : 'transparent',
                  }}
                >
                  {t('github.allLanguages')}
                </button>
                {languages.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLangFilter(lang === selectedLangFilter ? undefined : lang)}
                    className="text-[11px] px-2 py-0.5 rounded-full border transition-all"
                    style={{
                      borderColor: selectedLangFilter === lang ? ACCENT + '80' : 'rgba(255,255,255,0.1)',
                      color: selectedLangFilter === lang ? ACCENT : 'rgba(255,255,255,0.62)',
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
              {(['stars-desc', 'stars-asc', 'forks', 'name'] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => setSortOrder(option)}
                  className="px-2 py-1 rounded-md text-[11px] font-medium transition-all"
                  style={{
                    background: sortOrder === option ? 'rgba(255,255,255,0.08)' : 'transparent',
                    color: sortOrder === option ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.5)',
                    border: `1px solid ${sortOrder === option ? 'rgba(255,255,255,0.12)' : 'transparent'}`,
                  }}
                >
                  {t(`github.sort.${option}`)}
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
                      <div className="text-[11px] text-fg-subtle truncate mt-0.5">{repo.fullName}</div>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                      <span className="text-[11px] font-mono text-white/50">⭐{formatStars(repo.stars)}</span>
                      {repo.forks > 0 && (
                        <span className="text-[11px] text-fg-subtle">🍴{formatStars(repo.forks)}</span>
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
            <SegmentedTabs tabs={tabs} active={rightTab} onChange={setRightTab} accent={ACCENT} />

            <div className="flex-1 min-h-0" style={{ position: 'relative' }}>
              {/* Tab: Repo */}
              <div {...tabPanel(rightTab === 'repo', { overflowY: 'auto' })}>
                <RepoDetail repo={selectedRepo} />
              </div>

              {/* Tab: Linguagens */}
              <div {...tabPanel(rightTab === 'languages')}>
                <LanguageStarsChart repos={repos ?? []} />
              </div>

              {/* Tab: Análise */}
              <div {...tabPanel(rightTab === 'analysis', { display: 'flex', flexDirection: 'column', gap: 12 })}>
                <StarsDistributionChart repos={repos ?? []} />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </WidgetShell>
  )
}
