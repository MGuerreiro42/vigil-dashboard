import type { CSSProperties } from 'react'

// Dark panel with a faint grid behind the charts
export const chartFrameStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: '#06080f',
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.06)',
  backgroundImage: [
    'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
    'linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
  ].join(','),
  backgroundSize: '48px 48px',
  overflow: 'hidden',
}

export const chartTooltipStyle: CSSProperties = {
  background: 'rgba(13,17,23,0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  fontSize: 12,
}
