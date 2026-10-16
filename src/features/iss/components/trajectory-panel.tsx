import { motion } from 'framer-motion'
import type { ISSPosition, ISSFuturePosition } from '@/features/iss/types'
import { ACCENT } from '@/features/iss/lib/iss-display'

export function TrajectoryPanel({ futurePath, position }: { futurePath: ISSFuturePosition[]; position: ISSPosition | null }) {
  if (futurePath.length === 0) {
    return (
      <div style={{ width: 185, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>Calculando…</div>
      </div>
    )
  }

  const period = 92 // minutes (approximate ISS orbital period)
  const dayCount = futurePath.filter(point => point.visibility === 'daylight').length
  const dayPct = Math.round((dayCount / futurePath.length) * 100)

  return (
    <div style={{ width: 185, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
      {/* Orbit summary */}
      <div style={{
        padding: '9px 12px', borderRadius: 10,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.24)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
          Próxima órbita (~{period} min)
        </div>
        {/* Day/night bar */}
        <div style={{ height: 6, borderRadius: 99, background: '#818cf830', overflow: 'hidden', marginBottom: 6 }}>
          <div style={{ height: '100%', width: `${dayPct}%`, background: 'linear-gradient(90deg, #f59e0b, #fbbf24)', borderRadius: 99 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
          <span style={{ color: '#fbbf24' }}>☀ {dayPct}% dia</span>
          <span style={{ color: '#818cf8' }}>🌑 {100 - dayPct}% noite</span>
        </div>
      </div>

      {/* Timeline of future positions */}
      <div style={{
        padding: '8px 12px', borderRadius: 10,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.24)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
          Posições futuras
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {futurePath.map((fp, i) => {
            const minsFromNow = Math.round((fp.timestamp - (position?.timestamp ?? futurePath[0].timestamp)) / 60)
            const isDaylight = fp.visibility === 'daylight'
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <span style={{ fontSize: 9, color: isDaylight ? '#fbbf24' : '#818cf8', flexShrink: 0 }}>
                  {isDaylight ? '☀' : '🌑'}
                </span>
                <span style={{ fontSize: 9, color: ACCENT, fontFamily: 'monospace', flexShrink: 0, minWidth: 36 }}>
                  +{minsFromNow}m
                </span>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {Math.abs(fp.lat).toFixed(1)}°{fp.lat >= 0 ? 'N' : 'S'} {Math.abs(fp.lng).toFixed(1)}°{fp.lng >= 0 ? 'E' : 'W'}
                </span>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{
        padding: '8px 12px', borderRadius: 10,
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
        fontSize: 10, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <div style={{ width: 20, height: 2, background: '#f59e0b', borderRadius: 1, flexShrink: 0 }} />
          <span>Trajetória em luz do dia</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 20, height: 2, background: '#818cf8', borderRadius: 1, flexShrink: 0 }} />
          <span>Trajetória na sombra</span>
        </div>
      </div>
    </div>
  )
}
