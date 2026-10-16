import { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { ISSPosition } from '@/features/iss/types'
import { ACCENT, countryFlag, formatAltitude, formatCoordinate, formatVelocity } from '@/features/iss/lib/iss-display'
import { useTranslation } from 'react-i18next'
import { intlLocale } from '@/i18n'

export function NowPanel({
  position,
  countryCode,
  timezoneId,
  offset,
  coordsLoading,
  updateCount,
}: {
  position: ISSPosition | null
  countryCode: string | null | undefined
  timezoneId: string | undefined
  offset: number | undefined
  coordsLoading: boolean
  updateCount: number
}) {
  const { t } = useTranslation()
  const daylight = position?.visibility === 'daylight'

  const locationLabel = useMemo(() => {
    if (coordsLoading || countryCode === undefined) return '…'
    if (countryCode) return `${countryFlag(countryCode)} ${countryCode}`
    return t('iss.highSeas')
  }, [countryCode, coordsLoading, t])

  const tzLabel = timezoneId
    ? `${timezoneId.replace('_', ' ')} (UTC${offset != null && offset >= 0 ? '+' : ''}${offset ?? ''})`
    : '—'

  if (!position) return null

  const rows = [
    { id: 'latitude',   value: formatCoordinate(position.lat, 'N', 'S'),  color: ACCENT },
    { id: 'longitude',  value: formatCoordinate(position.lng, 'E', 'W'),  color: ACCENT },
    { id: 'altitude',   value: formatAltitude(position.altitude),           color: '#a855f7' },
    { id: 'velocity',   value: formatVelocity(position.velocity),           color: '#10b981' },
    { id: 'footprint',  value: `${Math.round(position.footprint).toLocaleString(intlLocale())} km`, color: '#f59e0b' },
    { id: 'solarPoint', value: formatCoordinate(position.solarLat, 'N', 'S'), color: '#fbbf24' },
  ] as const

  return (
    <div style={{ width: 185, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
      {/* Visibility */}
      <motion.div
        key={String(daylight)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          padding: '9px 12px', borderRadius: 10, textAlign: 'center',
          background: daylight ? 'rgba(251,191,36,0.07)' : 'rgba(129,140,248,0.07)',
          border: `1px solid ${daylight ? 'rgba(251,191,36,0.2)' : 'rgba(129,140,248,0.2)'}`,
        }}
      >
        <div style={{ fontSize: 22, marginBottom: 4 }}>{daylight ? '☀️' : '🌑'}</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: daylight ? '#fbbf24' : '#818cf8' }}>
          {daylight ? t('iss.daylight') : t('iss.eclipsed')}
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>{t('iss.visibility')}</div>
      </motion.div>

      {/* Country / timezone */}
      <div style={{
        padding: '8px 12px', borderRadius: 10,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
          {t('iss.overflight')}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{locationLabel}</div>
        {timezoneId && (
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.62)', marginTop: 3, lineHeight: 1.4 }}>{tzLabel}</div>
        )}
      </div>

      {/* Telemetry rows */}
      {rows.map(({ id, value, color }) => (
        <div key={id} style={{
          padding: '7px 12px', borderRadius: 10,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
        }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>
            {t(`iss.telemetry.${id}`)}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color, fontFamily: 'monospace' }}>{value}</div>
          {id === 'solarPoint' && (
            <div style={{ fontSize: 12, fontWeight: 700, color, fontFamily: 'monospace', marginTop: 2 }}>
              {formatCoordinate(position.solarLng, 'E', 'W')}
            </div>
          )}
        </div>
      ))}

      {/* Update counter */}
      <div style={{ textAlign: 'center', paddingTop: 2 }}>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>{t('iss.updatesEvery')}</div>
        <div style={{ fontSize: 10, fontFamily: 'monospace', color: ACCENT, marginTop: 2 }}>{t('iss.updateCount', { count: updateCount })}</div>
      </div>
    </div>
  )
}
