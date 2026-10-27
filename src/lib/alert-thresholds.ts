import type { AlertSeverity } from '@/store/alerts-store'

/** Shared by the alerts popover and the brief, so one fact gets the same severity in both. */
interface Limits {
  warning: number
  critical: number
}

export const QUAKE_MAGNITUDE: Limits = { warning: 5, critical: 6 }
// US AQI turns "very unhealthy" at 201
export const AQI: Limits = { warning: 100, critical: 201 }
export const KP: Limits = { warning: 5, critical: 7 }
export const CHANGE_PERCENT: Limits = { warning: 10, critical: 20 }

export const severityOf = (value: number, limits: Limits): AlertSeverity | null =>
  value >= limits.critical ? 'critical' : value >= limits.warning ? 'warning' : null
