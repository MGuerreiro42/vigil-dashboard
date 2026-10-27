const MINUS = '−'

/** Crypto price as in the design: 81,692 · 54.21 · 1.234 · 0.4321 (always en-US separators). */
export function formatPrice(value: number): string {
  if (value >= 1000) return value.toLocaleString('en-US', { maximumFractionDigits: 0 })
  if (value >= 10) return value.toFixed(2)
  if (value >= 1) return value.toFixed(3)
  return value.toFixed(4)
}

/** +1.23 / −1.23 with a true minus sign. */
export function formatSigned(value: number, digits = 2): string {
  return (value >= 0 ? '+' : MINUS) + Math.abs(value).toFixed(digits)
}

export type Tone = 'text' | 'dim' | 'ok' | 'warn' | 'err' | 'info' | 'land'

export const changeTone = (value: number): Tone => (value >= 0 ? 'ok' : 'err')

const AGE_UNITS: [string, number][] = [['d', 86_400_000], ['h', 3_600_000], ['m', 60_000], ['s', 1_000]]

/** Compact age for tables (12s, 46m, 2h, 9d); `spaced` gives the prose form (3 h). */
export function formatAge(elapsedMs: number, spaced = false): string {
  const elapsed = Math.max(0, elapsedMs)
  const [unit, size] = AGE_UNITS.find(([, unitMs]) => elapsed >= unitMs) ?? AGE_UNITS[AGE_UNITS.length - 1]
  return `${Math.floor(elapsed / size)}${spaced ? ' ' : ''}${unit}`
}

/** Local date from an ISO day (yyyy-mm-dd); `new Date(iso)` would read it as UTC midnight. */
export function parseIsoDay(isoDay: string): Date {
  const [year, month, day] = isoDay.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const monthShort = (date: Date, locale: string) => date.toLocaleString(locale, { month: 'short' }).replace('.', '')

/** pt "16 out" · en "Oct 16". */
export function formatShortDate(date: Date, locale: string): string {
  const month = monthShort(date, locale)
  return locale.startsWith('pt') ? `${date.getDate()} ${month}` : `${month} ${date.getDate()}`
}

/** pt "set 2026" (or "set 26" with a short year) · en "Sep 2026". */
export function formatMonthYear(date: Date, locale: string, shortYear = false): string {
  const year = String(date.getFullYear())
  return `${monthShort(date, locale)} ${shortYear ? year.slice(-2) : year}`
}

/** pt "14/10" · en "10/14". */
export function formatDayMonth(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })
}

/** mm:ss, for retry countdowns. */
export function formatCountdown(remainingMs: number): string {
  const seconds = Math.max(0, Math.ceil(remainingMs / 1000))
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

/** Local 24-hour "07:30", the same in every language. */
export function formatClock(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}
