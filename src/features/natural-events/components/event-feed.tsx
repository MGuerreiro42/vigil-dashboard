import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { formatRelativeTime } from '@/lib/format-relative-time'
import type { NaturalEvent } from '@/features/natural-events/types'
import { ALERT_COLOR, categoryStyle } from '@/features/natural-events/lib/event-style'

export function EventFeed({ events, selectedEventId, onEventClick }: {
  events: NaturalEvent[]
  selectedEventId: string | null
  onEventClick: (e: NaturalEvent) => void
}) {
  const sorted = useMemo(
    () => [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [events],
  )

  return (
    <div className="flex flex-col gap-0.5 overflow-y-auto flex-1 min-h-0 pr-0.5">
      {sorted.map(evt => {
        const cfg = categoryStyle(evt.categoryId)
        const isSelected = evt.id === selectedEventId
        return (
          <motion.div
            key={evt.id}
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => onEventClick(evt)}
            className="flex items-start gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition-colors group flex-shrink-0"
            style={{
              background: isSelected ? cfg.color + '18' : undefined,
              borderLeft: isSelected ? `2px solid ${cfg.color}` : '2px solid transparent',
            }}
          >
            <span className="text-base leading-none mt-0.5 flex-shrink-0">{cfg.icon}</span>
            <div className="flex-1 min-w-0">
              <div
                className="text-[11px] leading-tight line-clamp-2"
                style={{ color: isSelected ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.65)' }}
              >
                {evt.country ? `${evt.country} — ${evt.title}` : evt.title}
              </div>
              <div className="text-[10px] mt-0.5 flex items-center gap-1.5 flex-wrap" style={{ color: cfg.color + 'aa' }}>
                <span>{cfg.label}</span>
                <span className="text-white/20">·</span>
                <span>{formatRelativeTime(Math.floor(new Date(evt.date).getTime() / 1000))}</span>
                {evt.alertLevel && evt.alertLevel !== 'Green' && (
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: ALERT_COLOR[evt.alertLevel] + '20', color: ALERT_COLOR[evt.alertLevel], border: `1px solid ${ALERT_COLOR[evt.alertLevel]}40` }}
                  >
                    {evt.alertLevel}
                  </span>
                )}
                {evt.sourceUrl && (
                  <a
                    href={evt.sourceUrl}
                    target="_blank"
                    rel="noopener"
                    onClick={e => e.stopPropagation()}
                    className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: cfg.color + '99', fontSize: 10 }}
                  >↗</a>
                )}
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
