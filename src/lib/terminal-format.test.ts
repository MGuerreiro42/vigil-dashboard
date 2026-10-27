import { describe, expect, it } from 'vitest'
import { formatAge, formatCountdown, formatPrice, formatSigned } from './terminal-format'

describe('formatPrice', () => {
  it('picks precision by magnitude', () => {
    expect([81692.4, 54.214, 1.2345, 0.43219].map(formatPrice)).toEqual(['81,692', '54.21', '1.234', '0.4322'])
  })
})

describe('formatSigned', () => {
  it('uses a true minus sign', () => {
    expect(formatSigned(1.234)).toBe('+1.23')
    expect(formatSigned(-0.9)).toBe('−0.90')
    expect(formatSigned(0)).toBe('+0.00')
  })
})

describe('formatAge', () => {
  it('uses the largest whole unit', () => {
    expect([4_000, 46 * 60_000, 3 * 3_600_000 + 5, 9 * 86_400_000].map((ms) => formatAge(ms))).toEqual(['4s', '46m', '3h', '9d'])
  })

  it('has a spaced prose form and clamps negatives', () => {
    expect(formatAge(3 * 3_600_000, true)).toBe('3 h')
    expect(formatAge(-50)).toBe('0s')
  })
})

describe('formatCountdown', () => {
  it('rounds up to whole seconds', () => {
    expect(formatCountdown(41_200)).toBe('00:42')
    expect(formatCountdown(552_000)).toBe('09:12')
    expect(formatCountdown(-1)).toBe('00:00')
  })
})
