import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Panel } from '@/components/terminal/panel'
import { EmptyState, Level, MetaLine } from '@/components/terminal/text'
import { SCREENS } from '@/components/layout/sections'
import { sinceLastVisit } from '@/features/brief/lib/last-visit'
import type { BriefInsight, BriefText } from '@/features/brief/lib/generate-brief'
import { formatClock } from '@/lib/terminal-format'

const ROW_LINK = 'text-text no-underline hover:bg-row-hover hover:text-text hover:no-underline focus-visible:bg-row-hover'

function useBriefText() {
  const { t } = useTranslation()
  return ({ key, params }: BriefText) => t(`terminal.overview.brief.rows.${key}`, params)
}

function BriefRow({ insight }: { insight: BriefInsight }) {
  const { t } = useTranslation()
  const translate = useBriefText()
  const source = insight.sourceName ?? t(`terminal.overview.brief.sources.${insight.category as Exclude<BriefInsight['category'], 'health'>}`)
  const path = SCREENS[insight.screen - 1].path
  const time = formatClock(new Date(insight.at))
  const headline = translate(insight.headline)
  const detail = translate(insight.detail)

  return (
    <>
      <Link to={path} className={`${ROW_LINK} col-span-full grid grid-cols-subgrid items-baseline border-t border-line-subtle py-[6px] max-sm:hidden`}>
        <span className="text-dim">{time}</span>
        <Level severity={insight.severity} />
        <span className="overflow-hidden text-ellipsis whitespace-nowrap text-dim">{source}</span>
        <span className="flex min-w-0 flex-col">
          <span className="text-pretty">{headline}</span>
          <span className="text-pretty text-dim">{detail}</span>
        </span>
        <span className="text-right text-info">[{insight.screen}]</span>
      </Link>
      <Link to={path} className={`${ROW_LINK} col-span-full flex flex-col gap-[4px] border-t border-line-subtle py-[12px] sm:hidden`}>
        <span className="flex gap-[10px]">
          <Level severity={insight.severity} />
          <span>{source}</span>
          <span className="text-dim">{time}</span>
          <span className="ml-auto text-info">[{insight.screen}]</span>
        </span>
        <span className="line-clamp-3 text-pretty">{headline}</span>
        {/* Details are written as " · "-joined segments in both locales */}
        <MetaLine segments={detail.split(' · ')} />
      </Link>
    </>
  )
}

/** [1.1] rule-based brief: one row per notable fact, most severe first, each opening its screen. */
export function BriefPanel({ insights, className }: { insights: BriefInsight[]; className: string }) {
  const { t } = useTranslation()
  return (
    <Panel id="1.1" title={t('terminal.overview.brief.title')} meta={t('terminal.overview.brief.meta', { time: formatClock(new Date(sinceLastVisit())) })} className={className}>
      {insights.length === 0 ? (
        <EmptyState title={t('terminal.overview.brief.empty')} hint={t('terminal.overview.brief.emptyHint')} />
      ) : (
        <div className="grid grid-cols-[44px_44px_64px_minmax(0,1fr)_28px] gap-x-[14px] max-sm:grid-cols-[minmax(0,1fr)]">
          {insights.map((insight) => <BriefRow key={insight.id} insight={insight} />)}
        </div>
      )}
    </Panel>
  )
}
