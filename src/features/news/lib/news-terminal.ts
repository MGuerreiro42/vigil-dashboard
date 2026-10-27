import type { Tone } from '@/lib/terminal-format'

const MINUS = '−'
const TIMER_WIDTH = 30
const WORDS_PER_MINUTE = 200

/** Wiki edit size: +41,967 ok · −7 err · ±0 dim. */
export function byteDelta(value: number, locale: string): { text: string; tone: Tone } {
  const amount = Math.abs(value).toLocaleString(locale)
  if (value > 0) return { text: `+${amount}`, tone: 'ok' }
  if (value < 0) return { text: `${MINUS}${amount}`, tone: 'err' }
  return { text: '±0', tone: 'dim' }
}

/** "1:02" and "███████·······": time left and elapsed share of the discover auto-advance. */
export function discoverTimer(progress: number, durationMs: number): { left: string; bar: string } {
  const seconds = Math.ceil(((1 - progress) * durationMs) / 1000)
  return {
    left: `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`,
    bar: '█'.repeat(Math.round(progress * TIMER_WIDTH)).padEnd(TIMER_WIDTH, '·'),
  }
}

export function readingMinutes(text: string): number {
  return Math.max(1, Math.round(text.split(/\s+/).filter(Boolean).length / WORDS_PER_MINUTE))
}
