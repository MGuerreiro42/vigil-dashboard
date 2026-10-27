import type { Tone } from '@/lib/terminal-format'

// Literal class names so Tailwind generates them
export const TONE_CLASS: Record<Tone, string> = {
  text: 'text-text',
  dim: 'text-dim',
  ok: 'text-ok',
  warn: 'text-warn',
  err: 'text-err',
  info: 'text-info',
}
