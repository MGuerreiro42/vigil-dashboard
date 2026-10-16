import i18n from '@/i18n'
import type { NaturalEvent } from '@/features/natural-events/types'


export const ACCENT = '#10b981'

export const CATEGORIES = {
  earthquakes:        { icon: '🌍', color: '#f43f5e' },
  wildfires:          { icon: '🔥', color: '#f97316' },
  severeStorms:       { icon: '🌪️', color: '#818cf8' },
  volcanoes:          { icon: '🌋', color: '#ef4444' },
  seaLakeIce:         { icon: '🧊', color: '#67e8f9' },
  floods:             { icon: '🌊', color: '#3b82f6' },
  landslides:         { icon: '⛰️', color: '#92400e' },
  snow:               { icon: '❄️', color: '#cbd5e1' },
  tempExtremes:       { icon: '🌡️', color: '#f59e0b' },
  drought:            { icon: '☀️', color: '#d97706' },
  dustHaze:           { icon: '💨', color: '#a8a29e' },
  waterColor:         { icon: '🟦', color: '#0ea5e9' },
  manmade:            { icon: '⚠️', color: '#e11d48' },
} as const satisfies Record<string, { icon: string; color: string }>

export type CategoryId = keyof typeof CATEGORIES

function isCategoryId(id: string): id is CategoryId {
  return id in CATEGORIES
}

/** Icon, color and translated label (read at call time, so callers re-render on language change via useTranslation). */
export function categoryStyle(id: string): { label: string; icon: string; color: string } {
  if (!isCategoryId(id)) return { label: id, icon: '🌐', color: '#8b93a1' }
  return { ...CATEGORIES[id], label: i18n.t(`naturalEvents.categories.${id}`) }
}

// GDACS alert level → color
export const ALERT_COLOR: Record<string, string> = {
  Green: '#10b981',
  Orange: '#f97316',
  Red: '#ef4444',
}
export function alertBadge(level?: string) {
  if (!level) return null
  const label = level === 'Green' || level === 'Orange' || level === 'Red' ? i18n.t(`naturalEvents.alertLevels.${level}`) : level
  return { color: ALERT_COLOR[level] ?? '#8b93a1', label }
}

const STORM_SCALE = [
  { maxKnots: 34, key: 'TD', color: '#94a3b8' },
  { maxKnots: 64, key: 'TS', color: '#60a5fa' },
  { maxKnots: 83, key: 'C1', color: '#fde047' },
  { maxKnots: 96, key: 'C2', color: '#fb923c' },
  { maxKnots: 113, key: 'C3', color: '#ef4444' },
  { maxKnots: 137, key: 'C4', color: '#dc2626' },
  { maxKnots: Infinity, key: 'C5', color: '#7c3aed' },
] as const

/** Saffir-Simpson / WMO class for a wind speed in knots. */
export function stormCategory(knots: number): { label: string; color: string; short: string } {
  const step = STORM_SCALE.find((entry) => knots < entry.maxKnots) ?? STORM_SCALE[STORM_SCALE.length - 1]
  return {
    label: i18n.t(`naturalEvents.storms.${step.key}.label`),
    short: i18n.t(`naturalEvents.storms.${step.key}.short`),
    color: step.color,
  }
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
