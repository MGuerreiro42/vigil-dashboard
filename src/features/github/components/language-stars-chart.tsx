import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { LANG_COLORS } from '@/features/github/lib/github-format'
import type { GithubRepo } from '@/features/github/types'
import { chartFrameStyle, chartTooltipStyle } from '@/lib/chart-styles'

const MAX_LANGUAGES = 8

export function LanguageStarsChart({ repos }: { repos: GithubRepo[] }) {
  const languages = Array.from(new Set(repos.map((repo) => repo.language).filter(Boolean) as string[])).slice(0, MAX_LANGUAGES)
  const langStars = languages.map((lang) => ({
    lang,
    stars: repos.filter((repo) => repo.language === lang).reduce((total, repo) => total + repo.stars, 0),
    color: LANG_COLORS[lang] ?? '#8b8fa8',
  })).sort((first, second) => second.stars - first.stars)

  return (
    <div style={chartFrameStyle}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={langStars} layout="vertical" margin={{ top: 16, right: 24, left: -10, bottom: 8 }}>
          <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false}
            tickFormatter={(value) => (value >= 1000 ? `${(value / 1000).toFixed(0)}k` : String(value))} />
          <YAxis type="category" dataKey="lang" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
          <Tooltip
            contentStyle={chartTooltipStyle}
            formatter={(value) => [Number(value).toLocaleString(), 'Stars']}
            labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
          />
          <Bar dataKey="stars" radius={[0, 4, 4, 0]}>
            {langStars.map((entry, index) => (
              <Cell key={index} fill={entry.color} fillOpacity={0.75} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
