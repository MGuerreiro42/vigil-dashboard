import type { ISSTLE } from '@/features/iss/types'
import { ACCENT, epochToDate, orbitalPeriod } from '@/features/iss/lib/iss-display'
import { useTranslation } from 'react-i18next'

export function TLEPanel({ tle }: { tle: ISSTLE | undefined }) {
  const { t } = useTranslation()
  if (!tle) {
    return (
      <div className="w-full md:w-[185px]" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{t('iss.tle.loading')}</div>
      </div>
    )
  }

  const period = orbitalPeriod(tle.meanMotion)

  const elements = [
    { id: 'inclination',  value: `${tle.inclination.toFixed(4)}°`,  color: ACCENT,    tip: t('iss.tle.elements.inclination.tip') },
    { id: 'raan',         value: `${tle.raan.toFixed(4)}°`,         color: '#a855f7', tip: t('iss.tle.elements.raan.tip') },
    { id: 'eccentricity', value: tle.eccentricity.toFixed(7),       color: '#10b981', tip: t('iss.tle.elements.eccentricity.tip') },
    { id: 'argPerigee',   value: `${tle.argPerigee.toFixed(4)}°`,   color: '#f59e0b', tip: t('iss.tle.elements.argPerigee.tip') },
    { id: 'meanAnomaly',  value: `${tle.meanAnomaly.toFixed(4)}°`,  color: '#f97316', tip: t('iss.tle.elements.meanAnomaly.tip') },
    { id: 'meanMotion',   value: t('iss.tle.revPerDay', { value: tle.meanMotion.toFixed(5) }), color: '#22d3ee', tip: t('iss.tle.elements.meanMotion.tip', { minutes: period.toFixed(2) }) },
    { id: 'bstar',        value: tle.bstar.toExponential(3),        color: '#8b93a1', tip: t('iss.tle.elements.bstar.tip') },
  ] as const

  return (
    <div className="w-full md:w-[185px]" style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
      {/* Header */}
      <div style={{
        padding: '9px 12px', borderRadius: 10,
        background: 'rgba(168,85,247,0.07)', border: '1px solid rgba(168,85,247,0.2)',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#a855f7', marginBottom: 2 }}>
          {tle.header}
        </div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>
          {t('iss.tle.issuedOn', { date: epochToDate(tle.epochYear, tle.epochDay) })}
        </div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>
          {t('iss.tle.epochDay', { day: tle.epochDay.toFixed(5), year: tle.epochYear })}
        </div>
      </div>

      {/* Orbital elements */}
      {elements.map(({ id, value, color, tip }) => (
        <div
          key={id}
          title={tip}
          style={{
            padding: '7px 12px', borderRadius: 10, cursor: 'help',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
            {t(`iss.tle.elements.${id}.label`)}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color, fontFamily: 'monospace' }}>{value}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{tip}</div>
        </div>
      ))}

      {/* Raw TLE lines */}
      <div style={{
        padding: '8px 10px', borderRadius: 10,
        background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)',
        fontFamily: 'monospace', fontSize: 8, color: 'rgba(255,255,255,0.5)',
        lineHeight: 1.8, wordBreak: 'break-all',
      }}>
        <div style={{ color: 'rgba(255,255,255,0.62)', fontSize: 9, marginBottom: 4 }}>{t('iss.tle.raw')}</div>
        <div>{tle.line1}</div>
        <div>{tle.line2}</div>
      </div>
    </div>
  )
}
