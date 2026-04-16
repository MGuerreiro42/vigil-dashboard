import { LineChart, Line, ResponsiveContainer } from 'recharts'

interface Props {
  data: number[]
  color: string
  width?: number
  height?: number
}

export function CryptoSparkline({ data, color, width = 72, height = 32 }: Props) {
  if (!data || data.length === 0) return <div className="w-16 h-8 opacity-20 bg-white/10 rounded" />
  const chartData = data.map((v, i) => ({ i, v }))
  return (
    <ResponsiveContainer width={width} height={height}>
      <LineChart data={chartData}>
        <Line type="monotone" dataKey="v" dot={false} stroke={color} strokeWidth={1.5} />
      </LineChart>
    </ResponsiveContainer>
  )
}
