import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { ACCENT } from '@/features/github/lib/github-format'
import type { GithubRepo } from '@/features/github/types'
import { chartFrameStyle, chartTooltipStyle } from '@/lib/chart-styles'
import { useTranslation } from 'react-i18next'

const STAR_BUCKETS = [
  { range: '0–100',   min: 0,    max: 100 },
  { range: '100–500', min: 100,  max: 500 },
  { range: '500–1k',  min: 500,  max: 1000 },
  { range: '1k–5k',   min: 1000, max: 5000 },
  { range: '5k+',     min: 5000, max: Infinity },
]

export function StarsDistributionChart({ repos }: { repos: GithubRepo[] }) {
  const { t } = useTranslation()
  const starsDist = STAR_BUCKETS.map((bucket) => ({
    range: bucket.range,
    count: repos.filter((repo) => repo.stars >= bucket.min && repo.stars < bucket.max).length,
  }))

  return (
    <>
      <div style={{ flex: 1, position: 'relative' }}>
        <div style={chartFrameStyle}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={starsDist} margin={{ top: 16, right: 16, left: -16, bottom: 8 }}>
              <XAxis dataKey="range" tick={{ fill: 'rgba(255,255,255,0.62)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={chartTooltipStyle}
                formatter={(value) => [Number(value), t('github.reposSeries')]}
                labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
              />
              <Bar dataKey="count" fill={ACCENT} fillOpacity={0.7} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <p className="text-[10px] text-fg-subtle uppercase tracking-widest flex-shrink-0">{t('github.starsDistribution')}</p>
    </>
  )
}
