export function magnitudeColor(magnitude: number): string {
  if (magnitude >= 6.5) return '#f43f5e'
  if (magnitude >= 5.0) return '#f97316'
  if (magnitude >= 3.5) return '#f59e0b'
  return '#8b93a1'
}

export function magnitudeLabel(magnitude: number): string {
  if (magnitude >= 6.5) return 'Severo'
  if (magnitude >= 5.0) return 'Forte'
  if (magnitude >= 3.5) return 'Moderado'
  return 'Menor'
}
