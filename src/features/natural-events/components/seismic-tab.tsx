import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { magnitudeColor, magnitudeLabel } from '@/features/earthquakes/lib/magnitude'
import { formatRelativeTime } from '@/lib/format-relative-time'
import type { Earthquake } from '@/features/earthquakes/types'
import { useTranslation } from 'react-i18next'


export function SeismicTab({ quakes }: { quakes: Earthquake[] }) {
  const { t } = useTranslation()
  const [sort, setSort] = useState<'recent' | 'mag'>('mag')
  const sorted = useMemo(() => {
    const list = [...quakes]
    return sort === 'mag'
      ? list.sort((first, second) => second.magnitude - first.magnitude)
      : list.sort((first, second) => second.time - first.time)
  }, [quakes, sort])

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Sort controls + count */}
      <div className="flex items-center gap-1 mb-2 flex-shrink-0">
        {(['mag', 'recent'] as const).map(option => (
          <button
            key={option}
            onClick={() => setSort(option)}
            className="px-2.5 py-1 rounded-md text-[11px] font-medium transition-all"
            style={{
              background: sort === option ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: sort === option ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.28)',
              border: `1px solid ${sort === option ? 'rgba(255,255,255,0.12)' : 'transparent'}`,
            }}
          >
            {option === 'mag' ? t('naturalEvents.seismic.magnitude') : t('naturalEvents.seismic.recent')}
          </button>
        ))}
        <span className="ml-auto text-[10px] text-fg-subtle">{t('naturalEvents.seismic.events', { count: quakes.length })}</span>
      </div>

      {/* List */}
      <div className="flex flex-col gap-0.5 overflow-y-auto flex-1 min-h-0">
        {sorted.map((quake, i) => (
          <motion.a
            key={quake.id}
            href={quake.url} target="_blank" rel="noopener noreferrer"
            initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.015 }}
            className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-white/[0.04] transition-colors group flex-shrink-0"
          >
            <div
              className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0"
              style={{ background: magnitudeColor(quake.magnitude) + '18', border: `1px solid ${magnitudeColor(quake.magnitude)}30` }}
            >
              <span className="text-[12px] font-mono font-bold" style={{ color: magnitudeColor(quake.magnitude) }}>
                {quake.magnitude.toFixed(1)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] text-white/70 truncate group-hover:text-white/90">{quake.place}</div>
              <div className="text-[10px] text-fg-subtle mt-0.5 flex items-center gap-1.5">
                <span style={{ color: magnitudeColor(quake.magnitude) }}>{magnitudeLabel(quake.magnitude)}</span>
                <span>·</span>
                <span>{t('naturalEvents.seismic.depth', { depth: quake.depth.toFixed(0) })}</span>
                <span>·</span>
                <span>{formatRelativeTime(Math.floor(quake.time / 1000))}</span>
                {quake.tsunamiRisk && <span className="text-amber-400 ml-1">🌊</span>}
              </div>
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  )
}
