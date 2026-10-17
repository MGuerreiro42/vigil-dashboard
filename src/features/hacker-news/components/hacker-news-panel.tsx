import { useTranslation } from 'react-i18next'
import { autoFitGrid } from '@/components/terminal/grid'
import { QueryPanel } from '@/components/terminal/query-panel'
import { EmptyState, ExternalLink, ToneText } from '@/components/terminal/text'
import { useHackerNewsFrontPage } from '@/features/hacker-news/api/hacker-news'
import type { HackerNewsStory } from '@/features/hacker-news/types'
import { useNow } from '@/hooks/use-now'
import { formatAge } from '@/lib/terminal-format'

const PLACEHOLDER = [
  '··  ·······························  ··········',
  '    ····  ·········  ·····  ·············',
  '··  ··························  ·········',
]

function Story({ story, rank, now }: { story: HackerNewsStory; rank: number; now: number }) {
  const { t } = useTranslation()
  return (
    <div className="grid grid-cols-[24px_minmax(0,1fr)] gap-x-[10px] border-t border-line-subtle py-[4px]">
      <span className="text-dim">{rank}</span>
      <span className="flex min-w-0 flex-col">
        <span className="break-words">
          <ExternalLink href={story.url ?? story.discussionUrl} className="text-text">{story.title}</ExternalLink>
          {story.domain && <span className="text-dim"> ({story.domain})</span>}
        </span>
        <span className="text-dim">
          <ToneText tone="warn">▲{story.points}</ToneText> · {story.author} · {t('terminal.tech.hn.ago', { age: formatAge(now - story.createdAt * 1000) })} ·{' '}
          <ExternalLink href={story.discussionUrl} className="text-dim">{t('terminal.tech.hn.comments', { count: story.comments })}</ExternalLink>
        </span>
      </span>
    </div>
  )
}

/** [6.2] Hacker News front page, via Algolia. */
export function HackerNewsPanel() {
  const { t } = useTranslation()
  const query = useHackerNewsFrontPage()
  const now = useNow(60_000)
  return (
    <QueryPanel
      id="6.2"
      title={t('terminal.tech.hn.title')}
      meta={t('terminal.tech.hn.meta')}
      query={query}
      source="hn algolia"
      placeholder={PLACEHOLDER}
      cacheNote={(stories) => t('terminal.tech.hn.cached', { count: stories.length })}
    >
      {(stories) => stories.length
        ? (
            <div style={{ ...autoFitGrid(440), gap: '8px 32px' }}>
              {stories.map((story, index) => <Story key={story.id} story={story} rank={index + 1} now={now} />)}
            </div>
          )
        : <EmptyState title={t('terminal.tech.hn.empty')} hint={t('terminal.tech.hn.emptyHint')} />}
    </QueryPanel>
  )
}
