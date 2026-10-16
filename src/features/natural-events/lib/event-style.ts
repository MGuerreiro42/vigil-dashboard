import type { NaturalEvent } from '@/features/natural-events/types'


export const ACCENT = '#10b981'

export const CATEGORIES: Record<string, { label: string; icon: string; color: string }> = {
  wildfires:          { label: 'Incêndios',       icon: '🔥', color: '#f97316' },
  severeStorms:       { label: 'Tempestades',      icon: '🌪️', color: '#818cf8' },
  volcanoes:          { label: 'Vulcões',           icon: '🌋', color: '#ef4444' },
  seaLakeIce:         { label: 'Gelo Marinho',      icon: '🧊', color: '#67e8f9' },
  floods:             { label: 'Inundações',         icon: '🌊', color: '#3b82f6' },
  landslides:         { label: 'Deslizamentos',      icon: '⛰️', color: '#92400e' },
  snow:               { label: 'Neve',               icon: '❄️', color: '#cbd5e1' },
  tempExtremes:       { label: 'Extremos Térmicos', icon: '🌡️', color: '#f59e0b' },
  drought:            { label: 'Seca',               icon: '☀️', color: '#d97706' },
  dustHaze:           { label: 'Poeira / Névoa',     icon: '💨', color: '#a8a29e' },
  waterColor:         { label: 'Mancha na Água',     icon: '🟦', color: '#0ea5e9' },
  manmade:            { label: 'Incidentes',          icon: '⚠️', color: '#e11d48' },
}

export function categoryStyle(id: string) {
  return CATEGORIES[id] ?? { label: id, icon: '🌐', color: '#8b93a1' }
}

// GDACS alert level → color
export const ALERT_COLOR: Record<string, string> = {
  Green: '#10b981',
  Orange: '#f97316',
  Red: '#ef4444',
}
export function alertBadge(level?: string) {
  if (!level) return null
  return { color: ALERT_COLOR[level] ?? '#8b93a1', label: level }
}

export function stormCategory(kts: number): { label: string; color: string; short: string } {
  if (kts < 34)  return { label: 'Depressão Tropical', short: 'DT',   color: '#94a3b8' }
  if (kts < 64)  return { label: 'Tempestade Tropical', short: 'TT',   color: '#60a5fa' }
  if (kts < 83)  return { label: 'Categoria 1',          short: 'C1',   color: '#fde047' }
  if (kts < 96)  return { label: 'Categoria 2',          short: 'C2',   color: '#fb923c' }
  if (kts < 113) return { label: 'Categoria 3',          short: 'C3',   color: '#ef4444' }
  if (kts < 137) return { label: 'Categoria 4',          short: 'C4',   color: '#dc2626' }
  return               { label: 'Categoria 5',          short: 'C5',   color: '#7c3aed' }
}

// Radius scale for globe points — log scale, returns value in [0.25, 1.2]
export function magnitudeRadius(evt: NaturalEvent): number {
  const magnitude = evt.magnitude
  if (!magnitude || magnitude <= 0) return 0.45
  const unit = evt.magnitudeUnit ?? ''
  let value = magnitude
  if (unit === 'hectare') value = magnitude * 2.471 // convert to acres for uniform scale
  // log2 scale: 100ac→0.35, 1k→0.5, 10k→0.7, 100k→0.95, 1M→1.2
  const radius = 0.25 + (Math.log2(Math.max(value, 1)) / 20) * 0.95
  return Math.min(Math.max(radius, 0.25), 1.2)
}
