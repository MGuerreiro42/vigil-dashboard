import i18n from '@/i18n'
import type { AQICategory } from '@/features/weather/types'


export const ACCENT = '#22d3ee'

const AQI_COLORS: Record<AQICategory, string> = {
  good: '#10b981',
  moderate: '#f59e0b',
  'unhealthy-sensitive': '#f97316',
  unhealthy: '#f43f5e',
  'very-unhealthy': '#a855f7',
  hazardous: '#7c3aed',
}

export function describeAqi(category: AQICategory): { label: string; color: string } {
  return { label: i18n.t(`weather.aqi.${category}`), color: AQI_COLORS[category] }
}

export function formatHour(iso: string) {
  return iso.slice(11, 16) // "14:00"
}

export function uvLabel(uv: number): { label: string; color: string } {
  if (uv <= 2)  return { label: i18n.t('weather.uv.low'), color: '#10b981' }
  if (uv <= 5)  return { label: i18n.t('weather.uv.moderate'), color: '#f59e0b' }
  if (uv <= 7)  return { label: i18n.t('weather.uv.high'), color: '#f97316' }
  if (uv <= 10) return { label: i18n.t('weather.uv.veryHigh'), color: '#f43f5e' }
  return { label: i18n.t('weather.uv.extreme'), color: '#a855f7' }
}
