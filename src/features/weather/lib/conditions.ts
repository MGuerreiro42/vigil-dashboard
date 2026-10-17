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
