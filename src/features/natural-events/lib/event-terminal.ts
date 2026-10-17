import type { Tone } from '@/lib/terminal-format'
import type { NaturalEvent } from '@/features/natural-events/types'

export type AlertLevel = NonNullable<NaturalEvent['alertLevel']>

export const EVENT_CATEGORIES = ['wildfires', 'earthquakes', 'severeStorms', 'floods', 'drought', 'volcanoes'] as const
export type EventCategory = (typeof EVENT_CATEGORIES)[number]

export const CATEGORY_GLYPH: Record<EventCategory, string> = {
  wildfires: '*',
  earthquakes: 'o',
  severeStorms: '@',
  floods: '~',
  drought: '#',
  volcanoes: '^',
}

export const ALERT_TONE: Record<AlertLevel, Tone> = { Green: 'ok', Orange: 'warn', Red: 'err' }
export const ALERT_COLOR: Record<AlertLevel, string> = { Green: '--color-ok', Orange: '--color-warn', Red: '--color-err' }
const ALERT_RANK: Record<AlertLevel, number> = { Green: 0, Orange: 1, Red: 2 }

export const isEventCategory = (id: string): id is EventCategory => (EVENT_CATEGORIES as readonly string[]).includes(id)
export const eventGlyph = (event: NaturalEvent) => (isEventCategory(event.categoryId) ? CATEGORY_GLYPH[event.categoryId] : '?')
export const alertOf = (event: NaturalEvent): AlertLevel => event.alertLevel ?? 'Green'

/** Orange and red counted apart, colours with no event left out. */
export const highAlertCounts = (events: NaturalEvent[]) => (['Orange', 'Red'] as const)
  .map((level) => [level, events.filter((event) => event.alertLevel === level).length] as const)
  .filter(([, count]) => count > 0)

export type StormCategory = 'TS' | 'C1' | 'C2' | 'C3' | 'C4' | 'C5'

/** Saffir–Simpson category from sustained wind in knots; below hurricane strength is a tropical storm. */
export function saffirSimpson(knots: number): StormCategory {
  if (knots >= 137) return 'C5'
  if (knots >= 113) return 'C4'
  if (knots >= 96) return 'C3'
  if (knots >= 83) return 'C2'
  if (knots >= 64) return 'C1'
  return 'TS'
}

/** GDACS puts the depth only in the severity text: "Magnitude 5.2M, Depth:10km". */
export function depthFromDescription(description: string | null): number | null {
  const match = description?.match(/Depth:\s*([\d.]+)\s*km/i)
  return match ? Number(match[1]) : null
}

/** Highest alert among the events that started in each bucket, oldest bucket first; null when none started. */
export function timelineBuckets(events: NaturalEvent[], now: number, columns: number, bucketMs: number): (AlertLevel | null)[] {
  const buckets: (AlertLevel | null)[] = Array(columns).fill(null)
  for (const event of events) {
    const index = columns - 1 - Math.floor((now - new Date(event.date).getTime()) / bucketMs)
    if (index < 0 || index >= columns) continue
    const alert = alertOf(event)
    const current = buckets[index]
    if (current === null || ALERT_RANK[alert] > ALERT_RANK[current]) buckets[index] = alert
  }
  return buckets
}

/** "−7d      −5d  …  agora" laid out on the bucket columns; labels that would run into "now" are dropped. */
export function timelineAxis(columns: number, days: number, nowLabel: string, dayLabel: (daysAgo: number) => string): string {
  const axis = Array(columns).fill(' ')
  const nowStart = columns - nowLabel.length
  for (let daysAgo = days; daysAgo > 0; daysAgo -= 2) {
    const label = dayLabel(daysAgo)
    const start = Math.round(((days - daysAgo) / days) * columns)
    if (start + label.length > nowStart) continue
    axis.splice(start, label.length, ...label)
  }
  axis.splice(nowStart, nowLabel.length, ...nowLabel)
  return axis.join('')
}

export function countBy<Item>(items: Item[], key: (item: Item) => string): Map<string, number> {
  const counts = new Map<string, number>()
  items.forEach((item) => counts.set(key(item), (counts.get(key(item)) ?? 0) + 1))
  return counts
}

/** Countries named across events; GDACS lists several for events crossing borders. */
export function countryCount(events: NaturalEvent[]): number {
  return new Set(events.flatMap((event) => (event.country ?? '').split(',').map((country) => country.trim()).filter(Boolean))).size
}
