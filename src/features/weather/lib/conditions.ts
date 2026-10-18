import i18n from '@/i18n'

const KNOWN_CODES = [0, 1, 2, 3, 45, 48, 51, 53, 55, 61, 63, 65, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99] as const
type ConditionKey = `c${(typeof KNOWN_CODES)[number]}` | 'unknown'

/** Key under `terminal.conditions` for a WMO weather code. */
export function conditionKey(code: number): ConditionKey {
  return (KNOWN_CODES as readonly number[]).includes(code) ? (`c${code}` as ConditionKey) : 'unknown'
}

/** "garoa forte": lowercase condition in the active language. */
export function conditionLabel(code: number): string {
  return i18n.t(`terminal.conditions.${conditionKey(code)}`)
}

export type ShortConditionKey = 'clear' | 'partlyCloudy' | 'overcast' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'showers' | 'thunderstorm' | 'unknown'

// WMO ranges of the header's short table; snow is not in the design table, so it gets its own word
const SHORT_RANGES: [first: number, last: number, key: ShortConditionKey][] = [
  [0, 0, 'clear'],
  [1, 2, 'partlyCloudy'],
  [3, 3, 'overcast'],
  [45, 48, 'fog'],
  [51, 57, 'drizzle'],
  [61, 67, 'rain'],
  [71, 77, 'snow'],
  [80, 82, 'showers'],
  [85, 86, 'snow'],
  [95, 99, 'thunderstorm'],
]

/** Key under `terminal.conditionsShort`: at most 14 characters, for the header. */
export function shortConditionKey(code: number): ShortConditionKey {
  return SHORT_RANGES.find(([first, last]) => code >= first && code <= last)?.[2] ?? 'unknown'
}

/** "garoa": the short condition in the active language. */
export function shortConditionLabel(code: number): string {
  return i18n.t(`terminal.conditionsShort.${shortConditionKey(code)}`)
}
