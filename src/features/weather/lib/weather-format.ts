

export const ACCENT = '#22d3ee'

export const AQI_LABELS: Record<string, { label: string; color: string }> = {
  'good':               { label: 'Boa',       color: '#10b981' },
  'moderate':           { label: 'Moderada',  color: '#f59e0b' },
  'unhealthy-sensitive':{ label: 'Sensível',  color: '#f97316' },
  'unhealthy':          { label: 'Ruim',      color: '#f43f5e' },
  'very-unhealthy':     { label: 'Muito Ruim',color: '#a855f7' },
  'hazardous':          { label: 'Perigosa',  color: '#7c3aed' },
}

export function formatHour(iso: string) {
  return iso.slice(11, 16) // "14:00"
}

export function uvLabel(uv: number): { label: string; color: string } {
  if (uv <= 2)  return { label: 'Baixo',   color: '#10b981' }
  if (uv <= 5)  return { label: 'Moderado',color: '#f59e0b' }
  if (uv <= 7)  return { label: 'Alto',    color: '#f97316' }
  if (uv <= 10) return { label: 'Muito Alto', color: '#f43f5e' }
  return { label: 'Extremo', color: '#a855f7' }
}
