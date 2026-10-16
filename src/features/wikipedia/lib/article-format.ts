import { intlLocale } from '@/i18n'



export const ACCENT = '#a78bfa'

export function readingTime(text: string): number {
  return Math.max(1, Math.ceil(text.split(' ').length / 200))
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(intlLocale(), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
