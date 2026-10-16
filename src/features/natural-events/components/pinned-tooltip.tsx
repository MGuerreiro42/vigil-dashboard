import { motion } from 'framer-motion'
import { formatRelativeTime } from '@/lib/format-relative-time'
import type { NaturalEvent } from '@/features/natural-events/types'
import { categoryStyle, stormCategory } from '@/features/natural-events/lib/event-style'

export function PinnedTooltip({ evt, onClose }: { evt: NaturalEvent; onClose: () => void }) {
  const cfg = categoryStyle(evt.categoryId)
  const rel = formatRelativeTime(Math.floor(new Date(evt.date).getTime() / 1000))
  const absDate = new Date(evt.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  const latDir = evt.lat >= 0 ? 'N' : 'S'
  const lngDir = evt.lng >= 0 ? 'L' : 'O'
  const isStorm = evt.categoryId === 'severeStorms'
  const stormCat = isStorm && evt.magnitude ? stormCategory(evt.magnitude) : null

  // Magnitude display
  let magDisplay = ''
  if (evt.magnitude != null && evt.magnitudeUnit) {
    const unit = evt.magnitudeUnit
    if (unit === 'kts') magDisplay = `${evt.magnitude} kts`
    else if (unit === 'NM^2') magDisplay = `${evt.magnitude.toFixed(1)} NM²`
    else if (unit === 'hectare') magDisplay = `${(evt.magnitude).toLocaleString('pt-BR')} ha`
    else {
      magDisplay = evt.magnitude >= 1000
        ? `${(evt.magnitude / 1000).toFixed(1)}k ${unit}`
        : `${evt.magnitude.toFixed(0)} ${unit}`
    }
  }

  const hasFooter = !!evt.sourceUrl || !!evt.description

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.97 }}
      transition={{ duration: 0.18 }}
      style={{
        position: 'absolute', bottom: 40, left: 12, zIndex: 20,
        background: '#0d1117',
        border: `1px solid ${cfg.color}45`,
        borderRadius: 12,
        padding: '10px 13px',
        minWidth: 210, maxWidth: 250,
        boxShadow: `0 8px 32px rgba(0,0,0,0.75), 0 0 0 1px ${cfg.color}15`,
        fontFamily: 'system-ui, sans-serif',
        pointerEvents: 'auto',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
        <span style={{ fontSize: 16, lineHeight: 1 }}>{cfg.icon}</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, background: cfg.color + '18', padding: '1px 6px', borderRadius: 99 }}>{cfg.label}</span>
        {stormCat && (
          <span style={{ fontSize: 9, fontWeight: 700, color: stormCat.color, background: stormCat.color + '20', padding: '1px 6px', borderRadius: 99 }}>{stormCat.short}</span>
        )}
        {evt.status === 'open'
          ? <span style={{ marginLeft: 'auto', fontSize: 9, color: '#10b981', background: '#10b98118', padding: '1px 6px', borderRadius: 99, fontWeight: 700 }}>ATIVO</span>
          : <span style={{ marginLeft: 'auto', fontSize: 9, color: '#8b93a1', background: '#8b93a118', padding: '1px 6px', borderRadius: 99 }}>FECHADO</span>}
        <button onClick={onClose} style={{
          marginLeft: 4, background: 'rgba(255,255,255,0.06)', border: 'none',
          color: 'rgba(255,255,255,0.62)', borderRadius: 6, width: 18, height: 18,
          fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>×</button>
      </div>

      {/* Title */}
      <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.88)', lineHeight: 1.4, marginBottom: 7 }}>
        {evt.title}
      </div>

      {/* Info grid */}
      <div style={{ display: 'grid', gridTemplateColumns: magDisplay ? '1fr 1fr 1fr' : '1fr 1fr', gap: 4, marginBottom: hasFooter ? 7 : 0 }}>
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: '4px 7px' }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Data</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>{absDate}</div>
          <div style={{ fontSize: 9, color: cfg.color, marginTop: 1 }}>{rel}</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: '4px 7px' }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Coords</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace' }}>{Math.abs(evt.lat).toFixed(2)}°{latDir}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace' }}>{Math.abs(evt.lng).toFixed(2)}°{lngDir}</div>
        </div>
        {magDisplay && (
          <div style={{ background: cfg.color + '0f', border: `1px solid ${cfg.color}25`, borderRadius: 6, padding: '4px 7px' }}>
            <div style={{ fontSize: 9, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
              {isStorm ? 'Vento' : 'Área'}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: stormCat?.color ?? cfg.color }}>{magDisplay}</div>
            {stormCat && <div style={{ fontSize: 9, color: stormCat.color, marginTop: 1 }}>{stormCat.label}</div>}
          </div>
        )}
      </div>

      {/* Footer */}
      {hasFooter && (
        <div style={{ paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {evt.description && (
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.62)', lineHeight: 1.4 }}>{evt.description}</div>
          )}
          {evt.sourceUrl && (
            <a href={evt.sourceUrl} target="_blank" rel="noopener"
              style={{ color: cfg.color, fontSize: 10, textDecoration: 'none', borderBottom: `1px dotted ${cfg.color}55` }}>
              Ver fonte ↗
            </a>
          )}
        </div>
      )}
    </motion.div>
  )
}
