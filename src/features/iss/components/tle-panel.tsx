import type { ISSTLE } from '@/features/iss/types'
import { ACCENT, epochToDate, orbitalPeriod } from '@/features/iss/lib/iss-display'

export function TLEPanel({ tle }: { tle: ISSTLE | undefined }) {
  if (!tle) {
    return (
      <div style={{ width: 185, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Carregando TLE…</div>
      </div>
    )
  }

  const period = orbitalPeriod(tle.meanMotion)

  const elements = [
    { label: 'Inclinação',       value: `${tle.inclination.toFixed(4)}°`,        color: ACCENT,     tip: 'Ângulo da órbita em relação ao equador' },
    { label: 'RAAN',             value: `${tle.raan.toFixed(4)}°`,               color: '#a855f7',  tip: 'Ascensão Reta do Nodo Ascendente' },
    { label: 'Excentricidade',   value: tle.eccentricity.toFixed(7),             color: '#10b981',  tip: '0 = órbita perfeitamente circular' },
    { label: 'Arg. Perigeu',     value: `${tle.argPerigee.toFixed(4)}°`,         color: '#f59e0b',  tip: 'Ponto mais baixo da órbita' },
    { label: 'Anomalia Média',   value: `${tle.meanAnomaly.toFixed(4)}°`,        color: '#f97316',  tip: 'Posição na órbita no epoch' },
    { label: 'Mov. Médio',       value: `${tle.meanMotion.toFixed(5)} rev/dia`,  color: '#22d3ee',  tip: `Período: ${period.toFixed(2)} min` },
    { label: 'BSTAR (drag)',     value: tle.bstar.toExponential(3),              color: '#8b93a1',  tip: 'Coeficiente de arrasto balístico' },
  ]

  return (
    <div style={{ width: 185, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
      {/* Header */}
      <div style={{
        padding: '9px 12px', borderRadius: 10,
        background: 'rgba(168,85,247,0.07)', border: '1px solid rgba(168,85,247,0.2)',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#a855f7', marginBottom: 2 }}>
          {tle.header}
        </div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>
          TLE de {epochToDate(tle.epochYear, tle.epochDay)}
        </div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>
          Dia {tle.epochDay.toFixed(5)} de {tle.epochYear}
        </div>
      </div>

      {/* Orbital elements */}
      {elements.map(({ label, value, color, tip }) => (
        <div
          key={label}
          title={tip}
          style={{
            padding: '7px 12px', borderRadius: 10, cursor: 'help',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
            {label}
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
        <div style={{ color: 'rgba(255,255,255,0.62)', fontSize: 9, marginBottom: 4 }}>Raw TLE</div>
        <div>{tle.line1}</div>
        <div>{tle.line2}</div>
      </div>
    </div>
  )
}
