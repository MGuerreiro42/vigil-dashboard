import type { ISSPosition } from '@/features/iss/types'
import type { FocusTab } from './iss-widget'
import { ACCENT } from '@/features/iss/lib/iss-display'

export function StatsBar({
  position,
  followISS,
  onToggleFollow,
  activeTab,
  onTabChange,
}: {
  position: ISSPosition | null
  followISS: boolean
  onToggleFollow: () => void
  activeTab: FocusTab
  onTabChange: (t: FocusTab) => void
}) {
  if (!position) return null

  const tabs: { id: FocusTab; label: string }[] = [
    { id: 'now', label: '📡 Agora' },
    { id: 'trajectory', label: '🛤 Trajetória' },
    { id: 'tle', label: '🔭 TLE' },
  ]

  return (
    <div className="flex items-center gap-2 mb-3 flex-shrink-0 flex-wrap">
      {/* Quick stats */}
      <div className="flex flex-col px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
        <span className="text-[9px] uppercase tracking-widest text-fg-subtle leading-none">Altitude</span>
        <span className="text-[17px] font-mono font-bold leading-none mt-1.5" style={{ color: ACCENT }}>
          {position.altitude.toFixed(0)}
        </span>
        <span className="text-[9px] text-fg-subtle mt-0.5 leading-none">km</span>
      </div>
      <div className="flex flex-col px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
        <span className="text-[9px] uppercase tracking-widest text-fg-subtle leading-none">Velocidade</span>
        <span className="text-[17px] font-mono font-bold leading-none mt-1.5" style={{ color: '#10b981' }}>
          {(position.velocity / 3600).toFixed(2)}
        </span>
        <span className="text-[9px] text-fg-subtle mt-0.5 leading-none">km/s</span>
      </div>
      <div className="flex flex-col px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
        <span className="text-[9px] uppercase tracking-widest text-fg-subtle leading-none">Footprint</span>
        <span className="text-[17px] font-mono font-bold text-white/70 leading-none mt-1.5">
          {Math.round(position.footprint / 1000)}k
        </span>
        <span className="text-[9px] text-fg-subtle mt-0.5 leading-none">km visíveis</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 ml-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="text-[11px] px-3 py-1.5 rounded-lg transition-all"
            style={{
              background: activeTab === tab.id ? `${ACCENT}18` : 'rgba(255,255,255,0.04)',
              color: activeTab === tab.id ? ACCENT : 'rgba(255,255,255,0.4)',
              border: `1px solid ${activeTab === tab.id ? ACCENT + '35' : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Follow toggle */}
      <button
        onClick={onToggleFollow}
        className="flex items-center gap-1.5 text-[11px] px-3 py-2 rounded-xl transition-all ml-auto"
        style={{
          background: followISS ? `${ACCENT}15` : 'rgba(255,255,255,0.05)',
          color: followISS ? ACCENT : 'rgba(255,255,255,0.35)',
          border: `1px solid ${followISS ? ACCENT + '35' : 'rgba(255,255,255,0.1)'}`,
        }}
      >
        📡 {followISS ? 'Seguindo' : 'Livre'}
      </button>
    </div>
  )
}
