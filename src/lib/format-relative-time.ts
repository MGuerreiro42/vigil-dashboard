import { intlLocale } from '@/i18n'

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
  ['second', 1],
]

/** "5 min ago" / "há 5 min" in the active language, from a unix timestamp in seconds. */
export function formatRelativeTime(timestamp: number, now = Date.now()): string {
  const elapsed = Math.max(0, Math.floor(now / 1000 - timestamp))
  const [unit, seconds] = UNITS.find(([, size]) => elapsed >= size) ?? UNITS[UNITS.length - 1]
  return new Intl.RelativeTimeFormat(intlLocale(), { numeric: 'always', style: 'short' }).format(-Math.floor(elapsed / seconds), unit)
}
