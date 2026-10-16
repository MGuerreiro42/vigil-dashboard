import { useState } from 'react'
import { motion } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { WidgetShell } from '@/components/layout/WidgetShell'
import { useWeather } from '@/api/openmeteo'
import { useAirQuality } from '@/api/openaq'
import { useGeoStore } from '@/store/geo.store'
import { getWMO } from './wmoIcons'

const ACCENT = '#22d3ee'

const AQI_LABELS: Record<string, { label: string; color: string }> = {
  'good':               { label: 'Boa',       color: '#10b981' },
  'moderate':           { label: 'Moderada',  color: '#f59e0b' },
  'unhealthy-sensitive':{ label: 'Sensível',  color: '#f97316' },
  'unhealthy':          { label: 'Ruim',      color: '#f43f5e' },
  'very-unhealthy':     { label: 'Muito Ruim',color: '#a855f7' },
  'hazardous':          { label: 'Perigosa',  color: '#7c3aed' },
}

function formatHour(iso: string) {
  return iso.slice(11, 16) // "14:00"
}

function uvLabel(uv: number): { label: string; color: string } {
  if (uv <= 2)  return { label: 'Baixo',   color: '#10b981' }
  if (uv <= 5)  return { label: 'Moderado',color: '#f59e0b' }
  if (uv <= 7)  return { label: 'Alto',    color: '#f97316' }
  if (uv <= 10) return { label: 'Muito Alto', color: '#f43f5e' }
  return { label: 'Extremo', color: '#a855f7' }
}

type RightTab = '24h' | 'air' | 'details'

export function WeatherWidget({ isFocused = false }: { isFocused?: boolean }) {
  const coords = useGeoStore((state) => state.coords)

  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0)
  const [rightTab, setRightTab] = useState<RightTab>('24h')

  const { data: weather, isLoading, error, refetch, dataUpdatedAt } = useWeather(coords ?? undefined)
  const { data: air } = useAirQuality(coords ?? undefined)

  const current  = weather?.current
  const forecast = weather?.forecast ?? []
  const hourly   = weather?.hourly ?? []
  const wmo      = current ? getWMO(current.weatherCode) : null
  const aqiInfo  = air ? AQI_LABELS[air.category] : null
  const selectedDay = forecast[selectedDayIdx] ?? forecast[0]

  const hourlyChart = hourly.slice(0, 24).map((h) => ({
    hora: formatHour(h.time),
    Temp: Math.round(h.temp),
    Chuva: h.precipProb,
    Vento: Math.round(h.windSpeed),
  }))

  const tabs: { id: RightTab; label: string }[] = [
    { id: '24h',     label: '24h' },
    { id: 'air',     label: 'Qualidade do Ar' },
    { id: 'details', label: 'Detalhes' },
  ]

  return (
    <WidgetShell
      title="Clima & Qualidade do Ar"
      icon={<span className={isFocused ? 'text-2xl' : 'text-base'}>🌤</span>}
      isLoading={isLoading}
      error={error}
      onRetry={() => refetch()}
      lastUpdated={dataUpdatedAt || undefined}
      accentColor={ACCENT}
      isFocused={isFocused}
      fillHeight={isFocused}
    >
      {current && wmo && (
        <>
          {/* ── Stats header ── */}
          <div className="flex gap-2 mb-3 flex-shrink-0">
            <div className="flex flex-col justify-between px-3 py-2.5 rounded-xl border min-w-[68px]"
              style={{ background: ACCENT + '0d', borderColor: ACCENT + '35' }}>
              <span className="text-[10px] uppercase tracking-widest leading-none" style={{ color: ACCENT + 'aa' }}>Temperatura</span>
              <span className="text-[22px] font-mono font-bold leading-none mt-1.5" style={{ color: ACCENT }}>
                {current.temp.toFixed(0)}°
              </span>
              <span className="text-[10px] mt-1 leading-none" style={{ color: ACCENT + '80' }}>{wmo.label}</span>
            </div>

            <div className="flex flex-col justify-between px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] min-w-[68px]">
              <span className="text-[10px] uppercase tracking-widest text-white/25 leading-none">Sensação</span>
              <span className="text-[22px] font-mono font-bold text-white/85 leading-none mt-1.5">
                {current.feelsLike.toFixed(0)}°
              </span>
              <span className="text-[10px] text-white/20 mt-1 leading-none">térmica</span>
            </div>

            {air && aqiInfo ? (
              <div className="flex flex-col justify-between px-3 py-2.5 rounded-xl border min-w-[68px]"
                style={{ background: aqiInfo.color + '10', borderColor: aqiInfo.color + '35' }}>
                <span className="text-[10px] uppercase tracking-widest leading-none" style={{ color: aqiInfo.color + 'aa' }}>AQI</span>
                <span className="text-[22px] font-mono font-bold leading-none mt-1.5" style={{ color: aqiInfo.color }}>
                  {air.aqi}
                </span>
                <span className="text-[10px] mt-1 leading-none" style={{ color: aqiInfo.color + '80' }}>{aqiInfo.label}</span>
              </div>
            ) : (
              <div className="flex flex-col justify-between px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] min-w-[68px]">
                <span className="text-[10px] uppercase tracking-widest text-white/25 leading-none">AQI</span>
                <span className="text-[22px] font-mono font-bold text-white/85 leading-none mt-1.5">N/D</span>
                <span className="text-[10px] text-white/20 mt-1 leading-none">—</span>
              </div>
            )}

            <div className="flex flex-col justify-between px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] min-w-[68px]">
              <span className="text-[10px] uppercase tracking-widest text-white/25 leading-none">Vento</span>
              <span className="text-[22px] font-mono font-bold text-white/85 leading-none mt-1.5">
                {current.windSpeed.toFixed(0)}
              </span>
              <span className="text-[10px] text-white/20 mt-1 leading-none">km/h</span>
            </div>
          </div>

          {/* ── MODO COMPACTO ── */}
          {!isFocused && (
            <div className="flex flex-col gap-0.5">
              {forecast.slice(0, 7).map((day, i) => {
                const d = new Date(day.date)
                const dayName = i === 0 ? 'Hoje' : d.toLocaleDateString('pt-BR', { weekday: 'short' })
                const icon = getWMO(day.weatherCode).icon
                return (
                  <motion.div
                    key={day.date}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-white/4 transition-colors"
                  >
                    <span className="text-[12px] text-white/40 capitalize w-10">{dayName}</span>
                    <span className="text-base leading-none">{icon}</span>
                    <div className="flex-1" />
                    {day.precipitationProb > 20 && (
                      <span className="text-[11px]" style={{ color: ACCENT }}>{day.precipitationProb}%</span>
                    )}
                    <span className="text-[12px] font-mono text-white/70">{day.tempMax.toFixed(0)}°</span>
                    <span className="text-[12px] font-mono text-white/35">{day.tempMin.toFixed(0)}°</span>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* ── MODO EXPANDIDO: tiling ── */}
          {isFocused && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="flex gap-4 flex-1 min-h-0"
            >
              {/* Coluna esquerda — previsão 7 dias */}
              <div className="w-64 flex-shrink-0 flex flex-col min-h-0">
                <div className="flex flex-col gap-0.5 overflow-y-auto flex-1 min-h-0 pr-0.5">
                  {forecast.slice(0, 7).map((day, i) => {
                    const d = new Date(day.date)
                    const dayName = i === 0 ? 'Hoje' : d.toLocaleDateString('pt-BR', { weekday: 'long' })
                    const icon = getWMO(day.weatherCode).icon
                    const isSelected = selectedDayIdx === i
                    return (
                      <motion.div
                        key={day.date}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => { setSelectedDayIdx(i); setRightTab('details') }}
                        className="flex items-center gap-2.5 py-2 px-2 rounded-lg transition-colors cursor-pointer hover:bg-white/4 flex-shrink-0"
                        style={{
                          background: isSelected ? ACCENT + '14' : undefined,
                          outline: isSelected ? `1px solid ${ACCENT}38` : 'none',
                        }}
                      >
                        <span className="text-lg leading-none flex-shrink-0">{icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-medium text-white/75 capitalize">{dayName}</div>
                          <div className="flex gap-2 mt-0.5">
                            {day.precipitationProb > 20 && (
                              <span className="text-[11px]" style={{ color: ACCENT }}>💧{day.precipitationProb}%</span>
                            )}
                            <span className="text-[11px] text-white/30">UV {day.uvIndexMax.toFixed(0)}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-[12px] font-mono text-white/75">{day.tempMax.toFixed(0)}°</span>
                          <span className="text-[12px] font-mono text-white/35 ml-1">{day.tempMin.toFixed(0)}°</span>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>

              {/* Divisor */}
              <div className="w-px bg-white/6 flex-shrink-0" />

              {/* Coluna direita */}
              <div className="flex-1 min-w-0 flex flex-col gap-3">
                <div className="flex gap-1 flex-shrink-0">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setRightTab(tab.id)}
                      className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: rightTab === tab.id ? ACCENT + '20' : 'transparent',
                        color: rightTab === tab.id ? ACCENT : 'rgba(255,255,255,0.35)',
                        border: `1px solid ${rightTab === tab.id ? ACCENT + '50' : 'transparent'}`,
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex-1 min-h-0" style={{ position: 'relative' }}>
                  {/* Tab: 24h */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    opacity: rightTab === '24h' ? 1 : 0,
                    pointerEvents: rightTab === '24h' ? 'auto' : 'none',
                    transition: 'opacity 0.2s ease',
                  }}>
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: '#06080f',
                      borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.06)',
                      backgroundImage: [
                        'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
                        'linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                      ].join(','),
                      backgroundSize: '48px 48px',
                      overflow: 'hidden',
                    }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={hourlyChart} margin={{ top: 16, right: 16, left: -20, bottom: 8 }}>
                          <defs>
                            <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={ACCENT} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="rainGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                          <XAxis dataKey="hora" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} tickLine={false} axisLine={false} interval={3} />
                          <YAxis yAxisId="temp" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} tickLine={false} axisLine={false} />
                          <YAxis yAxisId="rain" orientation="right" domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 11 }} tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{ background: 'rgba(13,17,23,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                            labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                            itemStyle={{ color: 'rgba(255,255,255,0.8)' }}
                          />
                          <Area yAxisId="temp" type="monotone" dataKey="Temp" stroke={ACCENT} strokeWidth={2} fill="url(#tempGrad)" dot={false} name="Temp (°C)" />
                          <Area yAxisId="rain" type="monotone" dataKey="Chuva" stroke="#a855f7" strokeWidth={1.5} fill="url(#rainGrad)" dot={false} name="Chuva (%)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Tab: Qualidade do Ar */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    opacity: rightTab === 'air' ? 1 : 0,
                    pointerEvents: rightTab === 'air' ? 'auto' : 'none',
                    transition: 'opacity 0.2s ease',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}>
                    {air && aqiInfo ? (
                      <>
                        <div className="flex items-center gap-4 px-4 py-3 rounded-xl flex-shrink-0"
                          style={{ background: aqiInfo.color + '12', border: `1px solid ${aqiInfo.color}30` }}>
                          <div className="text-5xl font-mono font-bold" style={{ color: aqiInfo.color }}>{air.aqi}</div>
                          <div>
                            <div className="text-sm font-semibold" style={{ color: aqiInfo.color }}>AQI · {aqiInfo.label}</div>
                            <div className="text-[12px] text-white/40 mt-0.5">Índice de Qualidade do Ar</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 flex-shrink-0">
                          {[
                            { label: 'PM2.5', value: air.pm25, unit: 'µg/m³', limit: 25 },
                            { label: 'PM10',  value: air.pm10,  unit: 'µg/m³', limit: 50 },
                            { label: 'NO₂',   value: air.no2,   unit: 'µg/m³', limit: 40 },
                            { label: 'O₃',    value: air.o3,    unit: 'µg/m³', limit: 100 },
                          ].map(({ label, value, unit, limit }) => {
                            const pct = Math.min(100, (value / limit) * 100)
                            const color = pct > 100 ? '#f43f5e' : pct > 70 ? '#f59e0b' : '#10b981'
                            return (
                              <div key={label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                <div className="flex justify-between mb-2">
                                  <span className="text-[11px] text-white/40">{label}</span>
                                  <span className="text-[11px] font-mono text-white/60">{value.toFixed(1)} {unit}</span>
                                </div>
                                <div className="h-1 rounded-full bg-white/8">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.8, ease: 'easeOut' }}
                                    className="h-full rounded-full"
                                    style={{ background: color }}
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-white/30">Dados de qualidade do ar indisponíveis.</p>
                    )}
                  </div>

                  {/* Tab: Detalhes */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    opacity: rightTab === 'details' ? 1 : 0,
                    pointerEvents: rightTab === 'details' ? 'auto' : 'none',
                    transition: 'opacity 0.2s ease',
                    overflowY: 'auto',
                  }}>
                    {selectedDay && (() => {
                      const uv = uvLabel(selectedDay.uvIndexMax)
                      return (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col justify-between px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                            <span className="text-[10px] uppercase tracking-widest text-white/25 leading-none">🌅 Nascer</span>
                            <span className="text-[20px] font-mono font-bold text-white/85 leading-none mt-1.5">
                              {selectedDay.sunrise?.slice(11, 16) ?? '—'}
                            </span>
                            <span className="text-[10px] text-white/20 mt-1 leading-none">sol</span>
                          </div>
                          <div className="flex flex-col justify-between px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                            <span className="text-[10px] uppercase tracking-widest text-white/25 leading-none">🌇 Pôr</span>
                            <span className="text-[20px] font-mono font-bold text-white/85 leading-none mt-1.5">
                              {selectedDay.sunset?.slice(11, 16) ?? '—'}
                            </span>
                            <span className="text-[10px] text-white/20 mt-1 leading-none">sol</span>
                          </div>
                          <div className="flex flex-col justify-between px-3 py-2.5 rounded-xl border"
                            style={{ background: uv.color + '10', borderColor: uv.color + '30' }}>
                            <span className="text-[10px] uppercase tracking-widest leading-none" style={{ color: uv.color + 'aa' }}>Índice UV</span>
                            <span className="text-[22px] font-mono font-bold leading-none mt-1.5" style={{ color: uv.color }}>
                              {selectedDay.uvIndexMax.toFixed(0)}
                            </span>
                            <span className="text-[10px] mt-1 leading-none" style={{ color: uv.color + '80' }}>{uv.label}</span>
                          </div>
                          <div className="flex flex-col justify-between px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                            <span className="text-[10px] uppercase tracking-widest text-white/25 leading-none">Precipitação</span>
                            <span className="text-[22px] font-mono font-bold text-white/85 leading-none mt-1.5">
                              {selectedDay.precipitationProb}%
                            </span>
                            <span className="text-[10px] text-white/20 mt-1 leading-none">probabilidade</span>
                          </div>
                          <div className="flex flex-col justify-between px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                            <span className="text-[10px] uppercase tracking-widest text-white/25 leading-none">Máxima</span>
                            <span className="text-[22px] font-mono font-bold text-white/85 leading-none mt-1.5">
                              {selectedDay.tempMax.toFixed(0)}°
                            </span>
                            <span className="text-[10px] text-white/20 mt-1 leading-none">Celsius</span>
                          </div>
                          <div className="flex flex-col justify-between px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                            <span className="text-[10px] uppercase tracking-widest text-white/25 leading-none">Mínima</span>
                            <span className="text-[22px] font-mono font-bold text-white/85 leading-none mt-1.5">
                              {selectedDay.tempMin.toFixed(0)}°
                            </span>
                            <span className="text-[10px] text-white/20 mt-1 leading-none">Celsius</span>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </WidgetShell>
  )
}
