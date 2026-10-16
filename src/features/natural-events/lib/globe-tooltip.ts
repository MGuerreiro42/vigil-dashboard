import { formatRelativeTime } from '@/lib/format-relative-time'
import type { NaturalEvent } from '@/features/natural-events/types'
import { escapeHtml } from '@/lib/escape-html'
import { categoryStyle, stormCategory } from './event-style'

export function buildGlobeTooltip(evt: NaturalEvent): string {
  const cfg = categoryStyle(evt.categoryId)
  const rel = formatRelativeTime(Math.floor(new Date(evt.date).getTime() / 1000))
  const latDir = evt.lat >= 0 ? 'N' : 'S'
  const lngDir = evt.lng >= 0 ? 'L' : 'O'

  // Magnitude display
  let magLine = ''
  if (evt.magnitude != null && evt.magnitudeUnit) {
    const unit = evt.magnitudeUnit === 'kts' ? 'kts' : evt.magnitudeUnit === 'NM^2' ? 'NM²' : evt.magnitudeUnit
    if (evt.magnitudeUnit === 'kts') {
      const sc = stormCategory(evt.magnitude)
      magLine = `<span style="color:${sc.color};background:${sc.color}18;padding:1px 6px;border-radius:99px;font-size:9px;font-weight:700">${sc.short} · ${evt.magnitude} ${unit}</span>`
    } else {
      const display = evt.magnitude >= 1000
        ? `${(evt.magnitude / 1000).toFixed(1)}k ${unit}`
        : `${evt.magnitude.toFixed(0)} ${unit}`
      magLine = `<span style="color:${cfg.color};font-size:10px">${display}</span>`
    }
  }

  return `
    <div style="background:#0d1117;border:1px solid ${cfg.color}40;border-radius:10px;padding:9px 12px;min-width:170px;max-width:220px;font-family:system-ui,sans-serif;box-shadow:0 8px 32px rgba(0,0,0,0.7);">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
        <span style="font-size:16px;line-height:1">${cfg.icon}</span>
        <span style="font-size:10px;font-weight:700;color:${cfg.color};background:${cfg.color}18;padding:1px 6px;border-radius:99px">${cfg.label}</span>
        ${magLine}
      </div>
      <div style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.85);line-height:1.4;margin-bottom:5px">${escapeHtml(evt.title)}</div>
      ${evt.description ? `<div style="font-size:10px;color:rgba(255,255,255,0.62);margin-bottom:5px">${escapeHtml(evt.description)}</div>` : ''}
      <div style="font-size:10px;color:rgba(255,255,255,0.5)">${Math.abs(evt.lat).toFixed(2)}°${latDir} ${Math.abs(evt.lng).toFixed(2)}°${lngDir} · ${rel}</div>
    </div>
  `
}
