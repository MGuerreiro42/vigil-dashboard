import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { chartFrameStyle, chartTooltipStyle } from '@/lib/chart-styles'
import { ACCENT, formatHour } from '@/features/weather/lib/weather-format'
import type { HourlyPoint } from '@/features/weather/types'

export function HourlyForecastChart({ hourly }: { hourly: HourlyPoint[] }) {
  const hourlyChart = hourly.slice(0, 24).map((point) => ({
    hora: formatHour(point.time),
    Temp: Math.round(point.temp),
    Chuva: point.precipProb,
    Vento: Math.round(point.windSpeed),
  }))

  return (
    <div style={chartFrameStyle}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={hourlyChart} margin={{ top: 16, right: 16, left: -20, bottom: 8 }}>
          <defs>
            <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={ACCENT} stopOpacity={0.3} />
              <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="rainGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis dataKey="hora" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} tickLine={false} axisLine={false} interval={3} />
          <YAxis yAxisId="temp" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis yAxisId="rain" orientation="right" domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={chartTooltipStyle}
            labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
            itemStyle={{ color: 'rgba(255,255,255,0.8)' }}
          />
          <Area yAxisId="temp" type="monotone" dataKey="Temp" stroke={ACCENT} strokeWidth={2} fill="url(#tempGrad)" dot={false} name="Temp (°C)" />
          <Area yAxisId="rain" type="monotone" dataKey="Chuva" stroke="#a855f7" strokeWidth={1.5} fill="url(#rainGrad)" dot={false} name="Chuva (%)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
