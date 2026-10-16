import i18n from '@/i18n'

export function magnitudeColor(magnitude: number): string {
  if (magnitude >= 6.5) return '#f43f5e'
  if (magnitude >= 5.0) return '#f97316'
  if (magnitude >= 3.5) return '#f59e0b'
  return '#8b93a1'
}

export function magnitudeLabel(magnitude: number): string {
  if (magnitude >= 6.5) return i18n.t('earthquakes.magnitude.severe')
  if (magnitude >= 5.0) return i18n.t('earthquakes.magnitude.strong')
  if (magnitude >= 3.5) return i18n.t('earthquakes.magnitude.moderate')
  return i18n.t('earthquakes.magnitude.minor')
}
