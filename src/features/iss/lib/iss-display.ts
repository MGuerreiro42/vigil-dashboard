import { intlLocale } from '@/i18n'



export const ACCENT = '#22d3ee'

export function formatCoordinate(val: number, pos: string, neg: string) {
  return `${Math.abs(val).toFixed(3)}° ${val >= 0 ? pos : neg}`
}
export function formatAltitude(km: number) { return `${km.toFixed(1)} km` }
export function formatVelocity(kmh: number) { return `${(kmh / 3600).toFixed(2)} km/s` }

/** ISO 3166-1 alpha-2 → Unicode flag emoji */
export function countryFlag(code: string): string {
  return code.toUpperCase().split('').map(
    (letter) => String.fromCodePoint(letter.charCodeAt(0) - 65 + 0x1f1e6),
  ).join('')
}

/** Convert TLE epoch day-of-year to a readable date string */
export function epochToDate(year: number, day: number): string {
  const date = new Date(Date.UTC(year, 0, 1))
  date.setUTCDate(date.getUTCDate() + Math.floor(day) - 1)
  return date.toLocaleDateString(intlLocale(), { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

/** Orbital period in minutes from mean motion (rev/day) */
export function orbitalPeriod(meanMotion: number): number {
  return 24 * 60 / meanMotion
}
