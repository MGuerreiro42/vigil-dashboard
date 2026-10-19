import { useId, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { SelectableRow } from '@/components/terminal/data-table'
import { TWO_PANE } from '@/components/terminal/grid'
import { PickerButton } from '@/components/terminal/picker-button'
import { Clock } from '@/components/terminal/clock'
import { QueryPanel } from '@/components/terminal/query-panel'
import { Stat, StatLine } from '@/components/terminal/stat-line'
import { tabId, tabPanelId } from '@/components/terminal/tab-ids'
import { Tabs } from '@/components/terminal/tabs'
import { BlockBar, EmptyState, ExternalLink } from '@/components/terminal/text'
import { useTrendingRepos } from '@/features/github/api/github'
import {
  forkRatio, formatStars, meanForkRatio, median, repoLanguages, repoSummary, sortRepos, starBuckets, starsByLanguage, type RepoSort,
} from '@/features/github/lib/github-terminal'
import type { GithubRepo } from '@/features/github/types'
import { formatAge } from '@/lib/terminal-format'

type View = 'repo' | 'languages' | 'analysis'

const ALL = 'all'
const LIST_COLUMNS = 'minmax(0,1fr) 88px 56px'
const BAR_WIDTH = 40
// What fits the ~190px bar column at 390px
const PHONE_BAR_WIDTH = 20
const SORTS: RepoSort[] = ['starsDesc', 'starsAsc', 'forks', 'name']
const VIEWS: View[] = ['repo', 'languages', 'analysis']
const PLACEHOLDER = [
  '························  ··········  ·····',
  '··················  ··········  ·····',
  '·····················  ··········  ·····',
]

interface Selection {
  language: string
  sort: RepoSort
  view: View
  repoId: number | null
  pickerOpen: boolean
}

const INITIAL_SELECTION: Selection = { language: ALL, sort: 'starsDesc', view: 'repo', repoId: null, pickerOpen: false }

const languageLabel = (language: string | null) => language?.toLowerCase() ?? '—'

function RepoView({ repo, rank, total }: { repo: GithubRepo; rank: number; total: number }) {
  const { t } = useTranslation()
  const ratio = forkRatio(repo)
  return (
    <>
      <span className="text-title font-semibold break-words text-text">{repo.fullName}</span>
      {repo.description ? <span className="text-pretty">{repo.description}</span> : <span className="text-dim">{t('terminal.tech.github.noDescription')}</span>}
      <div className="grid grid-cols-[112px_minmax(0,1fr)] gap-x-[12px] gap-y-[2px]">
        <span className="text-dim">{t('terminal.tech.github.language')}</span><span>{repo.language ?? '—'}</span>
        <span className="text-dim">stars</span><span>{formatStars(repo.stars)} <span className="text-dim">· {t('terminal.tech.github.rank', { rank, total })}</span></span>
        <span className="text-dim">forks</span><span>{formatStars(repo.forks)}</span>
        <span className="text-dim">forks/stars</span><span>{ratio === null ? '—' : ratio.toFixed(2)}</span>
      </div>
      <span className="break-all text-dim">$ git clone https://github.com/{repo.fullName}</span>
      <ExternalLink href={repo.url} className="self-start">{t('terminal.tech.github.open')}</ExternalLink>
    </>
  )
}

function LanguagesView({ repos }: { repos: GithubRepo[] }) {
  const { t } = useTranslation()
  const rows = starsByLanguage(repos)
  const max = rows[0]?.stars ?? 0
  return (
    <>
      <span className="text-dim">{t('terminal.tech.github.languagesCaption')}</span>
      <div className="grid grid-cols-[96px_minmax(0,1fr)_44px] gap-x-[12px] gap-y-[2px]">
        {rows.map((row) => (
          <div key={row.language ?? ''} className="contents">
            <span className="overflow-hidden text-ellipsis whitespace-nowrap">{languageLabel(row.language)}</span>
            <BlockBar value={row.stars} max={max} width={BAR_WIDTH} phoneWidth={PHONE_BAR_WIDTH} tone="land" />
            <span className="text-right">{formatStars(row.stars)}</span>
          </div>
        ))}
      </div>
    </>
  )
}

function AnalysisView({ repos }: { repos: GithubRepo[] }) {
  const { t } = useTranslation()
  const buckets = starBuckets(repos)
  const max = Math.max(...buckets.map((bucket) => bucket.count))
  const largest = buckets.find((bucket) => bucket.count === max) ?? buckets[0]
  const range = t(`terminal.tech.github.ranges.${largest.id}`)
  const share = max === repos.length
    ? t('terminal.tech.github.allIn', { total: repos.length, range })
    : t('terminal.tech.github.mostIn', { count: max, total: repos.length, range })
  return (
    <>
      <span className="text-dim">{t('terminal.tech.github.analysisCaption')}</span>
      <div className="grid grid-cols-[72px_minmax(0,1fr)_32px] gap-x-[12px] gap-y-[2px]">
        {buckets.map((bucket) => (
          <div key={bucket.label} className="contents">
            <span>{bucket.label}</span>
            {bucket.count ? <BlockBar value={bucket.count} max={max} width={BAR_WIDTH} phoneWidth={PHONE_BAR_WIDTH} tone="land" /> : <span className="text-line">·</span>}
            <span className="text-right">{bucket.count}</span>
          </div>
        ))}
      </div>
      <span className="text-pretty text-dim">
        {t('terminal.tech.github.insight', {
          share,
          median: formatStars(Math.round(median(repos.map((repo) => repo.stars)))),
          ratio: meanForkRatio(repos).toFixed(2),
        })}
      </span>
    </>
  )
}

function GithubBody({ repos, selection, onSelection }: { repos: GithubRepo[]; selection: Selection; onSelection: (patch: Partial<Selection>) => void }) {
  const { t } = useTranslation()
  const listId = useId()
  const tabsId = useId()
  if (!repos.length) return <EmptyState title={t('terminal.tech.github.empty')} hint={t('terminal.tech.github.emptyHint')} />

  const { language, sort, view, pickerOpen } = selection
  const languages = repoLanguages(repos)
  const listed = sortRepos(language === ALL ? repos : repos.filter((repo) => repo.language === language), sort)
  const selected = listed.find((repo) => repo.id === selection.repoId) ?? listed[0] ?? repos[0]
  const byStars = sortRepos(repos, 'starsDesc')
  const summary = repoSummary(repos)
  const views: Record<View, ReactNode> = {
    repo: <RepoView repo={selected} rank={byStars.indexOf(selected) + 1} total={repos.length} />,
    languages: <LanguagesView repos={repos} />,
    analysis: <AnalysisView repos={repos} />,
  }

  return (
    <>
      <StatLine>
        <Stat label="repos">{summary.count}</Stat>
        <Stat label="stars">{formatStars(summary.stars)} <span className="text-dim">{t('terminal.tech.github.inList')}</span></Stat>
        {summary.topLanguage && (
          <Stat label={t('terminal.tech.github.language')}>{summary.topLanguage} <span className="text-dim">{t('terminal.tech.github.repoCount', { count: summary.topLanguageCount })}</span></Stat>
        )}
        <Stat label="forks">{formatStars(summary.forks)}</Stat>
      </StatLine>

      <div className={TWO_PANE}>
        <div className="flex w-full sm:hidden">
          <PickerButton open={pickerOpen} onToggle={() => onSelection({ pickerOpen: !pickerOpen })} controls={listId}>
            {selected.name} · {t('terminal.tech.github.picker', { count: listed.length })}
          </PickerButton>
        </div>

        <div id={listId} className={`min-w-0 max-w-[460px] flex-[1_1_320px] flex-col gap-[8px] ${pickerOpen ? 'flex' : 'flex max-sm:hidden'}`}>
          <Tabs
            variant="text"
            className="gap-x-[12px]!"
            label={t('terminal.tech.github.languageFilter')}
            value={language}
            onChange={(id) => onSelection({ language: id })}
            items={[{ id: ALL, label: t('terminal.tech.github.all') }, ...languages.map((id) => ({ id, label: languageLabel(id) }))]}
          />
          <Tabs
            variant="text"
            label={t('terminal.tech.github.sort.label')}
            value={sort}
            onChange={(id) => onSelection({ sort: id })}
            items={SORTS.map((id) => ({ id, label: t(`terminal.tech.github.sort.${id}`) }))}
          />
          <div className="flex flex-col">
            {listed.map((repo) => (
              <SelectableRow key={repo.id} columns={LIST_COLUMNS} selected={repo.id === selected.id} onSelect={() => onSelection({ repoId: repo.id, view: 'repo', pickerOpen: false })}>
                <span className="overflow-hidden text-left text-ellipsis whitespace-nowrap">{repo.name}</span>
                <span className="overflow-hidden text-left text-ellipsis whitespace-nowrap text-dim">{languageLabel(repo.language)}</span>
                <span className="text-right">★{formatStars(repo.stars)}</span>
              </SelectableRow>
            ))}
          </div>
        </div>

        <div className="flex min-w-0 flex-[3_1_480px] flex-col gap-[12px]">
          <Tabs
            label={t('terminal.tech.github.tabs.label')}
            idBase={tabsId}
            value={view}
            onChange={(id) => onSelection({ view: id })}
            items={VIEWS.map((id) => ({ id, label: t(`terminal.tech.github.tabs.${id}`) }))}
          />
          <div role="tabpanel" id={tabPanelId(tabsId, view)} aria-labelledby={tabId(tabsId, view)} className="flex min-w-0 flex-col gap-[12px]">
            {views[view]}
          </div>
        </div>
      </div>
    </>
  )
}

/** [6.1] Most-starred repos created in the last 7 days (GitHub search), with language and star analysis. */
export function GithubPanel() {
  const { t } = useTranslation()
  const query = useTrendingRepos()
  // Kept here so a failed refetch, which swaps the panel frame, does not reset the selection
  const [selection, setSelection] = useState(INITIAL_SELECTION)
  const onSelection = (patch: Partial<Selection>) => setSelection((current) => ({ ...current, ...patch }))
  return (
    <QueryPanel
      id="6.1"
      title={t('terminal.tech.github.title')}
      gap={14}
      meta={<Clock>{(now) => t('terminal.tech.github.meta', { age: formatAge(now - query.dataUpdatedAt) })}</Clock>}
      query={query}
      source="github search"
      placeholder={PLACEHOLDER}
      cacheNote={(repos) => t('terminal.tech.github.picker', { count: repos.length })}
    >
      {(repos) => <GithubBody repos={repos} selection={selection} onSelection={onSelection} />}
    </QueryPanel>
  )
}
