import { afterAll, expect, it } from 'vitest'
import i18n from '@/i18n'
import { formatRelativeTime } from './format-relative-time'

const NOW = Date.UTC(2026, 9, 16, 12, 0, 0)
const secondsAgo = (seconds: number) => NOW / 1000 - seconds

afterAll(() => i18n.changeLanguage('en'))

it('picks the largest whole unit', async () => {
  await i18n.changeLanguage('en')
  expect(formatRelativeTime(secondsAgo(30), NOW)).toMatch(/30 sec/)
  expect(formatRelativeTime(secondsAgo(5 * 60), NOW)).toMatch(/5 min/)
  expect(formatRelativeTime(secondsAgo(3 * 3600), NOW)).toMatch(/3 hr/)
  expect(formatRelativeTime(secondsAgo(2 * 86400), NOW)).toMatch(/2 days/)
})

it('follows the active language', async () => {
  await i18n.changeLanguage('pt')
  expect(formatRelativeTime(secondsAgo(5 * 60), NOW)).toMatch(/^há 5 min/)
  await i18n.changeLanguage('en')
  expect(formatRelativeTime(secondsAgo(5 * 60), NOW)).toMatch(/5 min\.? ago$/)
})

it('never reports a future time for clock skew', () => {
  expect(formatRelativeTime(NOW / 1000 + 10, NOW)).toMatch(/0 sec/)
})
