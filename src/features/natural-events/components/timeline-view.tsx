import { useState, useMemo } from 'react'
import { formatRelativeTime } from '@/lib/format-relative-time'
import type { NaturalEvent } from '@/features/natural-events/types'
import { ACCENT, CATEGORIES, categoryStyle } from '@/features/natural-events/lib/event-style'

export function TimelineView({ events }: { events: NaturalEvent[] }) {
  const [hovered, setHovered] = useState<NaturalEvent | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  // Captured once per mount: the timeline is re-created whenever its tab opens
  const [nowMs] = useState(() => Date.now())
  const startMs = nowMs - 20 * 24 * 60 * 60 * 1000

  const categories = useMemo(() => {
    const ids = Array.from(new Set(events.map(event => event.categoryId)))
    return ids.filter(id => CATEGORIES[id]).sort((first, second) => {
      const firstCount = events.filter(event => event.categoryId === first).length
      const secondCount = events.filter(event => event.categoryId === second).length
      return secondCount - firstCount
    })
  }, [events])

  const toXPct = (dateStr: string) => {
    const timestamp = Math.max(startMs, Math.min(nowMs, new Date(dateStr).getTime()))
    return ((timestamp - startMs) / (nowMs - startMs)) * 100
  }

  const dayLabels = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => {
      const timestamp = startMs + ((i + 1) / 5) * (nowMs - startMs)
      const date = new Date(timestamp)
      return { label: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), pct: ((i + 1) / 5) * 100 }
    })
  }, [startMs, nowMs])

  return (
    <div
      style={{
        position: 'absolute', inset: 0,
        background: '#06080f',
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.06)',
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)',
        backgroundSize: '100% calc(100% / ' + (categories.length || 1) + ')',
        overflow: 'hidden',
        padding: '12px 16px 32px 128px',
      }}
      onMouseMove={event => setMousePos({ x: event.clientX, y: event.clientY })}
    >
      {/* Category rows */}
      {categories.map((catId, idx) => {
        const cfg = categoryStyle(catId)
        const catEvents = events.filter(event => event.categoryId === catId)
        const rowPct = ((idx + 0.5) / categories.length) * 100

        return (
          <div key={catId} style={{ position: 'absolute', left: 128, right: 16, top: `${rowPct}%`, transform: 'translateY(-50%)' }}>
            {/* Label */}
            <div style={{ position: 'absolute', left: -122, width: 112, textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
              <span style={{ fontSize: 12 }}>{cfg.icon}</span>
              <span style={{ fontSize: 10, color: cfg.color, opacity: 0.85, whiteSpace: 'nowrap' }}>{cfg.label}</span>
            </div>

            {/* Row line */}
            <div style={{ height: 1, background: cfg.color + '18', width: '100%', position: 'relative' }}>
              {/* Events */}
              {catEvents.map(evt => (
                <div
                  key={evt.id}
                  onMouseEnter={() => setHovered(evt)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    position: 'absolute',
                    left: `${toXPct(evt.date)}%`,
                    top: -5,
                    width: 10, height: 10,
                    borderRadius: '50%',
                    background: cfg.color,
                    opacity: hovered?.id === evt.id ? 1 : 0.65,
                    transform: 'translateX(-50%)',
                    cursor: 'pointer',
                    boxShadow: hovered?.id === evt.id ? `0 0 8px ${cfg.color}` : 'none',
                    transition: 'opacity 0.15s, box-shadow 0.15s',
                    zIndex: 2,
                  }}
                />
              ))}
            </div>
          </div>
        )
      })}

      {/* Time axis */}
      <div style={{ position: 'absolute', bottom: 8, left: 128, right: 16 }}>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', width: '100%', position: 'relative' }}>
          {dayLabels.map(({ label, pct }) => (
            <div key={label} style={{ position: 'absolute', left: `${pct}%`, transform: 'translateX(-50%)', top: 4 }}>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>{label}</span>
            </div>
          ))}
          <div style={{ position: 'absolute', left: 0, top: 4 }}>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>−20d</span>
          </div>
          <div style={{ position: 'absolute', right: 0, top: 4 }}>
            <span style={{ fontSize: 9, color: ACCENT }}>agora</span>
          </div>
        </div>
      </div>

      {/* Hover tooltip */}
      {hovered && (
        <div style={{
          position: 'fixed',
          left: mousePos.x + 12,
          top: mousePos.y - 60,
          zIndex: 50,
          background: '#06080f',
          border: `1px solid ${categoryStyle(hovered.categoryId).color}40`,
          borderRadius: 8,
          padding: '8px 12px',
          minWidth: 200,
          maxWidth: 260,
          pointerEvents: 'none',
          boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 14 }}>{categoryStyle(hovered.categoryId).icon}</span>
            <span style={{ fontSize: 11, color: categoryStyle(hovered.categoryId).color, fontWeight: 600 }}>{categoryStyle(hovered.categoryId).label}</span>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>{hovered.title}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{formatRelativeTime(Math.floor(new Date(hovered.date).getTime() / 1000))}</div>
        </div>
      )}
    </div>
  )
}
