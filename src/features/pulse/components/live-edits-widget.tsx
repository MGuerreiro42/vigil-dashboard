import { useTranslation } from 'react-i18next'
import { Bar, BarChart, ResponsiveContainer, YAxis } from 'recharts'
import { WidgetShell } from '@/components/layout/widget-shell'
import { StatTile } from '@/components/ui/stat-tile'
import { useWikiEditStream } from '@/features/pulse/hooks/use-wiki-edit-stream'

const ACCENT = '#a78bfa'

export function LiveEditsWidget() {
  const { t } = useTranslation()
  const { snapshot, status } = useWikiEditStream()
  const summary = snapshot?.summary
  const chartData = summary?.perSecond.map((count, second) => ({ second, count }))

  return (
    <WidgetShell
      title={t('pulse.edits.title')}
      icon={<span className="text-xl">✏️</span>}
      isLoading={!snapshot}
      error={null}
      accentColor={ACCENT}
      isLive={status === 'live'}
      isFocused
      fillHeight
    >
      {snapshot && summary && (
        <div className="flex flex-col gap-3 flex-1 min-h-0">
          <div className="grid grid-cols-3 gap-2">
            <StatTile label={t('pulse.edits.perMinute')} value={summary.perMinute} caption={t('pulse.edits.allLanguages')} color={ACCENT} />
            <StatTile label={t('pulse.edits.bots')} value={`${Math.round(summary.botShare * 100)}%`} caption={t('pulse.edits.ofEdits')} />
            <StatTile label={t('pulse.edits.newArticles')} value={summary.newArticles} caption={t('pulse.edits.lastMinute')} valueColor="#34d399" />
          </div>

          <div className="flex items-end gap-3">
            <div className="h-12 flex-1" aria-hidden>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <YAxis hide domain={[0, 'dataMax']} />
                  <Bar dataKey="count" fill={ACCENT} radius={[2, 2, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <ul className="flex flex-wrap gap-1 max-w-[50%] justify-end">
              {summary.topLanguages.map((entry) => (
                <li key={entry.language} className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-white/[0.05] text-fg-muted">
                  {entry.language} <span className="text-white/80">{entry.count}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-[10px] uppercase tracking-widest text-fg-subtle">{t('pulse.edits.feed')}</p>
          <ul className="flex-1 min-h-0 overflow-y-auto flex flex-col">
            {snapshot.feed.map((edit) => (
              <li key={edit.id} className="flex items-center gap-2 py-1 text-[12px] border-b border-white/[0.04]">
                <span className="w-7 flex-shrink-0 text-center font-mono text-[10px] rounded bg-white/[0.06] text-fg-muted">{edit.language}</span>
                <a href={edit.url} target="_blank" rel="noreferrer" className="flex-1 truncate text-white/80 hover:text-white">
                  {edit.isNewArticle && <span className="text-emerald-300 mr-1">★</span>}
                  {edit.title}
                </a>
                <span className="hidden sm:block w-28 truncate text-right text-[11px] text-fg-subtle">{edit.user}</span>
                <span className={`w-14 text-right font-mono text-[11px] ${edit.byteDelta >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {edit.byteDelta >= 0 ? '+' : ''}{edit.byteDelta}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-fg-subtle">{status === 'reconnecting' ? t('pulse.edits.reconnecting') : t('pulse.edits.source')}</p>
        </div>
      )}
    </WidgetShell>
  )
}
