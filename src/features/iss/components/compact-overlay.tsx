import { useMemo } from 'react'
import type { ISSPosition } from '@/features/iss/types'
import { ACCENT, countryFlag, formatAltitude, formatCoordinate } from '@/features/iss/lib/iss-display'

export function CompactOverlay({
  position,
  countryCode,
  timezoneId,
  coordsLoading,
}: {
  position: ISSPosition | null
  countryCode: string | null | undefined
  timezoneId: string | undefined
  coordsLoading: boolean
}) {
  const locationLabel = useMemo(() => {
    if (coordsLoading) return '…'
    if (countryCode) return `${countryFlag(countryCode)} ${countryCode}`
    if (timezoneId) {
      // Extract ocean/region from timezone like "Etc/GMT+3" or "Indian/Christmas"
      const parts = timezoneId.split('/')
      if (parts[0] === 'Etc') return '🌊 Alto Mar'
      return `🌊 ${parts[0]}`
    }
    return '🌊 Alto Mar'
  }, [countryCode, timezoneId, coordsLoading])

  if (!position) return null
  const daylight = position.visibility === 'daylight'

  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      padding: '28px 10px 8px',
      background: 'linear-gradient(to top, rgba(3,5,14,0.93) 55%, transparent)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      pointerEvents: 'none',
    }}>
      <div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>
          sobrevoo
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.80)', fontWeight: 600, marginBottom: 2 }}>
          {locationLabel}
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.62)', fontFamily: 'monospace' }}>
          {formatCoordinate(position.lat, 'N', 'S')}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        <span style={{
          fontSize: 9, fontWeight: 700,
          color: daylight ? '#fbbf24' : '#818cf8',
          background: daylight ? 'rgba(251,191,36,0.12)' : 'rgba(129,140,248,0.12)',
          border: `1px solid ${daylight ? 'rgba(251,191,36,0.25)' : 'rgba(129,140,248,0.25)'}`,
          padding: '2px 7px', borderRadius: 99,
        }}>
          {daylight ? '☀ dia' : '🌑 noite'}
        </span>
        <span style={{ fontSize: 10, color: ACCENT, fontFamily: 'monospace' }}>
          ↑ {formatAltitude(position.altitude)}
        </span>
      </div>
    </div>
  )
}
