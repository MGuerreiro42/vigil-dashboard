import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { formatRelativeTime } from '@/lib/format-relative-time'
import type { NaturalEvent } from '@/features/natural-events/types'
import { categoryStyle, stormCategory } from '@/features/natural-events/lib/event-style'

export function CategoriesView({ events }: { events: NaturalEvent[] }) {
  const categoryGroups = useMemo(() => {
    const groups: Record<string, NaturalEvent[]> = {}
    events.forEach(e => {
      if (!groups[e.categoryId]) groups[e.categoryId] = []
      groups[e.categoryId].push(e)
    })
    return Object.entries(groups)
      .sort(([, a], [, b]) => b.length - a.length)
      .map(([id, evts]) => ({
        id,
        cfg: categoryStyle(id),
        count: evts.length,
        latest: evts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0],
      }))
  }, [events])

  // Top fires by area (need magnitude in acres or hectares)
  const topFires = useMemo(() => {
    return events
      .filter(e => e.categoryId === 'wildfires' && e.magnitude != null)
      .map(e => ({
        ...e,
        acres: e.magnitudeUnit === 'hectare'
          ? (e.magnitude! * 2.471)
          : e.magnitude!,
      }))
      .sort((a, b) => b.acres - a.acres)
      .slice(0, 7)
  }, [events])

  // Active storms with intensity
  const storms = useMemo(() => {
    return events
      .filter(e => e.categoryId === 'severeStorms')
      .map(e => ({
        ...e,
        cat: e.magnitude ? stormCategory(e.magnitude) : stormCategory(0),
      }))
      .sort((a, b) => (b.magnitude ?? 0) - (a.magnitude ?? 0))
  }, [events])

  const maxAcres = topFires[0]?.acres ?? 1

  return (
    <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: '4px 4px 16px 4px' }}>

      {/* Category cards grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: 8,
        marginBottom: (topFires.length > 0 || storms.length > 0) ? 16 : 0,
      }}>
        {categoryGroups.map(({ id, cfg, count, latest }) => (
          <motion.div
            key={id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ background: cfg.color + '0c', border: `1px solid ${cfg.color}28`, borderRadius: 12, padding: '10px 12px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 20 }}>{cfg.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: cfg.color, background: cfg.color + '18', padding: '1px 7px', borderRadius: 99 }}>{count}</span>
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 3 }}>{cfg.label}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {latest.title}
            </div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.18)', marginTop: 5 }}>
              {formatRelativeTime(Math.floor(new Date(latest.date).getTime() / 1000))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* 🔥 Fire ranking by area */}
      {topFires.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>🔥</span> Maiores Incêndios Ativos
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {topFires.map((fire, i) => {
              const pct = (fire.acres / maxAcres) * 100
              const label = fire.acres >= 1000
                ? `${(fire.acres / 1000).toFixed(1)}k ac`
                : `${fire.acres.toFixed(0)} ac`
              return (
                <motion.div
                  key={fire.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace', width: 14, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', marginBottom: 2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                      {fire.title}
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, #f9731640, #f97316)`,
                        borderRadius: 99,
                      }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 10, color: '#f97316', fontFamily: 'monospace', flexShrink: 0, minWidth: 50, textAlign: 'right' }}>{label}</span>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* 🌀 Storm intensity */}
      {storms.length > 0 && (
        <div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>🌀</span> Tempestades Ativas
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {storms.map(storm => (
              <motion.div
                key={storm.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: storm.cat.color + '0c',
                  border: `1px solid ${storm.cat.color}25`,
                  borderRadius: 8, padding: '7px 10px',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 600, marginBottom: 2 }}>{storm.title}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                    {formatRelativeTime(Math.floor(new Date(storm.date).getTime() / 1000))}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: storm.cat.color, fontFamily: 'monospace' }}>{storm.magnitude} kts</div>
                  <div style={{ fontSize: 9, color: storm.cat.color + 'aa', marginTop: 1 }}>{storm.cat.short} · {storm.cat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
