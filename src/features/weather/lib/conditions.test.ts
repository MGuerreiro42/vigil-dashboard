import { describe, expect, it } from 'vitest'
import { en } from '@/i18n/locales/en'
import { pt } from '@/i18n/locales/pt'
import { shortConditionKey } from './conditions'

describe('shortConditionKey', () => {
  it('groups WMO codes as the header table does', () => {
    expect([0, 1, 2, 3, 45, 48].map(shortConditionKey)).toEqual(['clear', 'partlyCloudy', 'partlyCloudy', 'overcast', 'fog', 'fog'])
    expect([51, 55, 61, 65, 80, 82, 95, 99].map(shortConditionKey)).toEqual(['drizzle', 'drizzle', 'rain', 'rain', 'showers', 'showers', 'thunderstorm', 'thunderstorm'])
    expect([73, 86, 4, 100].map(shortConditionKey)).toEqual(['snow', 'snow', 'unknown', 'unknown'])
  })

  it('keeps every short label within 14 characters in both languages', () => {
    for (const labels of [pt.terminal.conditionsShort, en.terminal.conditionsShort]) {
      for (const label of Object.values(labels)) expect(label.length).toBeLessThanOrEqual(14)
    }
    expect(pt.terminal.conditionsShort.partlyCloudy).toBe('parc. nublado')
  })
})
