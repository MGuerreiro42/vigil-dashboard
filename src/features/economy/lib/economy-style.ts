export const ACCENT = '#34d399'

// Fear & Greed bands as alternative.me defines them
export function fearGreedColor(value: number): string {
  if (value < 25) return '#f43f5e'
  if (value < 45) return '#f97316'
  if (value <= 55) return '#facc15'
  if (value <= 75) return '#84cc16'
  return '#10b981'
}
