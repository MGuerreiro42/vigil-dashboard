import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { chartTooltipStyle } from '@/lib/chart-styles'
import { intlLocale } from '@/i18n'
import type { SeriesPoint } from '@/features/economy/types'

interface Props {
  points: SeriesPoint[]
  color: string
  label: string
  format: (value: number) => string
}

export function SeriesChart({ points, color, label, format }: Props) {
  const gradientId = `series-${label.replace(/\W/g, '')}`
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={points} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" hide />
        <YAxis domain={['auto', 'auto']} tickFormatter={format} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} axisLine={false} tickLine={false} width={56} />
        <Tooltip
          contentStyle={chartTooltipStyle}
          labelFormatter={(date) => new Date(`${String(date)}T00:00:00Z`).toLocaleDateString(intlLocale(), { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })}
          formatter={(value) => [format(Number(value)), label]}
        />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#${gradientId})`} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
