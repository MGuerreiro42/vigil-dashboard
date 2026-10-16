const pad = (value: number) => String(value).padStart(2, '0')

/** "2d 04:12:09" until `target`, or null once it has passed. */
export function formatCountdown(target: number, now: number): string | null {
  const remaining = Math.floor((target - now) / 1000)
  if (remaining <= 0) return null
  const days = Math.floor(remaining / 86_400)
  const hours = Math.floor((remaining % 86_400) / 3_600)
  const minutes = Math.floor((remaining % 3_600) / 60)
  const seconds = remaining % 60
  return `${days > 0 ? `${days}d ` : ''}${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}
