import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, ZAxis, CartesianGrid } from 'recharts'
import { WidgetShell } from '@/components/layout/WidgetShell'
import { useEarthquakes } from '@/api/usgs'
import { formatRelativeTime } from '@/hooks/useRelativeTime'
import { useAlertsStore } from '@/store/alerts.store'
import { escapeHtml } from '@/lib/escapeHtml'
import type * as Leaflet from 'leaflet'


const ACCENT = '#f43f5e'

function magColor(mag: number): string {
  if (mag >= 6.5) return '#f43f5e'
  if (mag >= 5.0) return '#f97316'
  if (mag >= 3.5) return '#f59e0b'
  return '#6b7280'
}

function magLabel(mag: number): string {
  if (mag >= 6.5) return 'Severo'
  if (mag >= 5.0) return 'Forte'
  if (mag >= 3.5) return 'Moderado'
  return 'Menor'
}

const US_STATES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC','PR','GU','VI','AS','MP',
])

const COUNTRY_FLAGS: Record<string, string> = {
  'Afghanistan': '🇦🇫', 'Albania': '🇦🇱', 'Algeria': '🇩🇿', 'Argentina': '🇦🇷',
  'Armenia': '🇦🇲', 'Australia': '🇦🇺', 'Austria': '🇦🇹', 'Azerbaijan': '🇦🇿',
  'Bolivia': '🇧🇴', 'Brazil': '🇧🇷', 'Bulgaria': '🇧🇬', 'Canada': '🇨🇦',
  'Chile': '🇨🇱', 'China': '🇨🇳', 'Colombia': '🇨🇴', 'Costa Rica': '🇨🇷',
  'Croatia': '🇭🇷', 'Cuba': '🇨🇺', 'Cyprus': '🇨🇾', 'Ecuador': '🇪🇨',
  'El Salvador': '🇸🇻', 'Ethiopia': '🇪🇹', 'Fiji': '🇫🇯', 'France': '🇫🇷',
  'Georgia': '🇬🇪', 'Greece': '🇬🇷', 'Guatemala': '🇬🇹', 'Honduras': '🇭🇳',
  'Iceland': '🇮🇸', 'India': '🇮🇳', 'Indonesia': '🇮🇩', 'Iran': '🇮🇷',
  'Iraq': '🇮🇶', 'Italy': '🇮🇹', 'Jamaica': '🇯🇲', 'Japan': '🇯🇵',
  'Kazakhstan': '🇰🇿', 'Kenya': '🇰🇪', 'Kyrgyzstan': '🇰🇬', 'Mexico': '🇲🇽',
  'Mongolia': '🇲🇳', 'Morocco': '🇲🇦', 'Myanmar': '🇲🇲', 'Nepal': '🇳🇵',
  'New Zealand': '🇳🇿', 'Nicaragua': '🇳🇮', 'North Korea': '🇰🇵',
  'Pakistan': '🇵🇰', 'Panama': '🇵🇦', 'Papua New Guinea': '🇵🇬', 'Peru': '🇵🇪',
  'Philippines': '🇵🇭', 'Portugal': '🇵🇹', 'Romania': '🇷🇴', 'Russia': '🇷🇺',
  'Serbia': '🇷🇸', 'Solomon Islands': '🇸🇧', 'South Korea': '🇰🇷', 'Spain': '🇪🇸',
  'Taiwan': '🇹🇼', 'Tajikistan': '🇹🇯', 'Tanzania': '🇹🇿', 'Timor-Leste': '🇹🇱',
  'Tonga': '🇹🇴', 'Turkey': '🇹🇷', 'Turkmenistan': '🇹🇲', 'Uzbekistan': '🇺🇿',
  'Vanuatu': '🇻🇺', 'Venezuela': '🇻🇪', 'Vietnam': '🇻🇳', 'Yemen': '🇾🇪',
}

function getCountryFlag(place: string): string {
  const lastPart = place.split(',').pop()?.trim() ?? ''
  if (US_STATES.has(lastPart.toUpperCase())) return '🇺🇸'
  if (COUNTRY_FLAGS[lastPart]) return COUNTRY_FLAGS[lastPart]
  // Regiões sem vírgula que pertencem aos EUA
  const lower = place.toLowerCase()
  if (['alaska', 'hawaii', 'california', 'nevada', 'oregon', 'washington',
       'montana', 'oklahoma', 'puerto rico'].some((r) => lower.includes(r)))
    return '🇺🇸'
  // Partial match contra o place completo
  for (const [country, flag] of Object.entries(COUNTRY_FLAGS)) {
    if (place.includes(country)) return flag
  }
  return ''
}

type SortOrder = 'recent' | 'mag-desc' | 'mag-asc'

type QuakeForMap = {
  id: string
  magnitude: number
  place: string
  location: { lat: number; lng: number }
  depth: number
  time: number
  significance: number
  tsunamiRisk: boolean
  url: string
}

function buildPopupHTML(quake: QuakeForMap): string {
  const color = magColor(quake.magnitude)
  const label = magLabel(quake.magnitude)
  const relTime = formatRelativeTime(Math.floor(quake.time / 1000))
  const tsunamiRow = quake.tsunamiRisk
    ? `<div style="display:flex;align-items:center;gap:6px;padding:6px 10px;margin:8px -14px -2px;background:rgba(245,158,11,0.08);border-top:1px solid rgba(245,158,11,0.15)">
        <span style="font-size:13px">⚠️</span>
        <span style="font-size:11px;color:#f59e0b;font-weight:500">Risco de tsunami</span>
       </div>`
    : ''
  return `
    <div style="padding:14px 14px 12px;min-width:200px;font-family:Inter,system-ui,sans-serif">
      <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:6px">
        <span style="font-size:22px;font-weight:700;font-family:monospace;letter-spacing:-0.5px;color:${color}">M${quake.magnitude.toFixed(1)}</span>
        <span style="font-size:11px;font-weight:500;padding:1px 7px;border-radius:99px;background:${color}20;color:${color}">${label}</span>
      </div>
      <div style="font-size:12px;color:rgba(255,255,255,0.75);line-height:1.45;margin-bottom:10px;max-width:220px">${escapeHtml(quake.place)}</div>
      <div style="display:flex;flex-direction:column;gap:4px;border-top:1px solid rgba(255,255,255,0.06);padding-top:10px">
        <div style="display:flex;justify-content:space-between;gap:16px">
          <span style="font-size:11px;color:rgba(255,255,255,0.35)">Profundidade</span>
          <span style="font-size:11px;color:rgba(255,255,255,0.65);font-family:monospace">${quake.depth.toFixed(0)} km</span>
        </div>
        <div style="display:flex;justify-content:space-between;gap:16px">
          <span style="font-size:11px;color:rgba(255,255,255,0.35)">Ocorreu</span>
          <span style="font-size:11px;color:rgba(255,255,255,0.65)">${relTime}</span>
        </div>
        <div style="display:flex;justify-content:space-between;gap:16px">
          <span style="font-size:11px;color:rgba(255,255,255,0.35)">Significância</span>
          <span style="font-size:11px;color:rgba(255,255,255,0.65);font-family:monospace">${quake.significance}</span>
        </div>
      </div>
      ${tsunamiRow}
      <a href="${escapeHtml(quake.url)}" target="_blank" rel="noopener noreferrer" class="eq-popup-link"
        style="display:inline-block;margin-top:12px;font-size:11px;color:${color};opacity:0.65;text-decoration:none;transition:opacity 0.15s">
        Ver no USGS ↗
      </a>
    </div>
  `
}

// O mapa NUNCA desmonta — apenas fica invisível quando a aba não está ativa.
// Inicialização adiada até que o container tenha dimensões reais (evita tiles fragmentados).
function LeafletMap({
  quakes,
  isActive,
  selectedQuakeId,
}: {
  quakes: QuakeForMap[]
  isActive: boolean
  selectedQuakeId: string | null
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Leaflet.Map | null>(null)
  const layerRef = useRef<Leaflet.LayerGroup | null>(null)
  const leafletRef = useRef<typeof Leaflet | null>(null)
  const roRef = useRef<ResizeObserver | null>(null)
  const rafRef = useRef<number | null>(null)
  const markersRef = useRef<Map<string, Leaflet.CircleMarker>>(new Map())
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return
    let cancelled = false
    const markers = markersRef.current

    function initMap(leaflet: typeof Leaflet) {
      if (cancelled || !containerRef.current || mapRef.current) return

      const map = leaflet.map(containerRef.current, {
        center: [20, 0],
        zoom: 2,
        zoomControl: false,
        attributionControl: false,
      })

      leaflet.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
      }).addTo(map)

      leafletRef.current = leaflet
      layerRef.current = leaflet.layerGroup().addTo(map)
      mapRef.current = map
      setReady(true)

      roRef.current = new ResizeObserver(() => {
        mapRef.current?.invalidateSize({ animate: false })
      })
      if (containerRef.current) roRef.current.observe(containerRef.current)
    }

    // Espera o container ter dimensões reais antes de inicializar o Leaflet.
    // Isso evita tiles fragmentados quando o mapa monta enquanto o layout ainda está sendo calculado.
    function tryInit() {
      if (cancelled || !containerRef.current) return
      const { offsetWidth, offsetHeight } = containerRef.current
      if (offsetWidth === 0 || offsetHeight === 0) {
        rafRef.current = requestAnimationFrame(tryInit)
        return
      }
      import('leaflet').then(initMap)
    }

    rafRef.current = requestAnimationFrame(tryInit)

    return () => {
      cancelled = true
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      roRef.current?.disconnect()
      roRef.current = null
      mapRef.current?.remove()
      mapRef.current = null
      layerRef.current = null
      markers.clear()
    }
  }, [])

  useEffect(() => {
    const leaflet = leafletRef.current
    const layer = layerRef.current
    if (!ready || !leaflet || !layer) return
    layer.clearLayers()
    markersRef.current.clear()
    quakes.forEach((quake) => {
      const color = magColor(quake.magnitude)
      const marker = leaflet.circleMarker([quake.location.lat, quake.location.lng], {
        radius: Math.max(5, quake.magnitude * 3.5),
        fillColor: color,
        color,
        weight: 1,
        fillOpacity: 0.65,
      })
        .bindPopup(buildPopupHTML(quake), { maxWidth: 280, className: 'eq-popup' })
        .addTo(layer)
      markersRef.current.set(quake.id, marker)
    })
  }, [quakes, ready])

  // Quando um item da lista é selecionado, voa até ele e abre o popup
  useEffect(() => {
    if (!selectedQuakeId || !mapRef.current) return
    const quake = quakes.find((candidate) => candidate.id === selectedQuakeId)
    if (!quake) return
    mapRef.current.flyTo([quake.location.lat, quake.location.lng], 5, { animate: true, duration: 0.8 })
    // Aguarda a animação antes de abrir o popup
    const id = setTimeout(() => markersRef.current.get(selectedQuakeId)?.openPopup(), 850)
    return () => clearTimeout(id)
  }, [selectedQuakeId, quakes])

  // Quando a aba ativa muda para 'map', força recalculo após o CSS atualizar
  useEffect(() => {
    if (!isActive || !mapRef.current) return
    const id = setTimeout(() => mapRef.current?.invalidateSize({ animate: false }), 50)
    return () => clearTimeout(id)
  }, [isActive])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 12,
        // Visibilidade via opacity — o container NUNCA some do layout
        opacity: isActive ? 1 : 0,
        pointerEvents: isActive ? 'auto' : 'none',
        transition: 'opacity 0.2s ease',
      }}
    />
  )
}

type RightTab = 'map' | 'analysis'

type ScatterPoint = {
  mag: number
  depth: number
  size: number
  place: string
  time: number
  tsunamiRisk: boolean
  flag: string
}

function ScatterTooltip({ active, payload }: { active?: boolean; payload?: { payload: ScatterPoint }[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const color = magColor(d.mag)
  const label = magLabel(d.mag)
  return (
    <div style={{
      background: '#06080f',
      border: `1px solid ${color}40`,
      borderRadius: 10,
      padding: '12px 14px',
      minWidth: 190,
      boxShadow: `0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px ${color}10`,
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {/* Magnitude + badge */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 20, fontWeight: 700, fontFamily: 'monospace', color, letterSpacing: '-0.5px' }}>
          M{d.mag.toFixed(1)}
        </span>
        <span style={{ fontSize: 11, fontWeight: 500, padding: '1px 7px', borderRadius: 99, background: color + '20', color }}>
          {label}
        </span>
        {d.flag && <span style={{ fontSize: 14, marginLeft: 'auto' }}>{d.flag}</span>}
      </div>

      {/* Local */}
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.45, marginBottom: 10, maxWidth: 210 }}>
        {d.place}
      </div>

      {/* Métricas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)' }}>Profundidade</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace' }}>{d.depth} km</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)' }}>Ocorreu</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{formatRelativeTime(Math.floor(d.time / 1000))}</span>
        </div>
      </div>

      {/* Tsunami */}
      {d.tsunamiRisk && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '5px 8px', background: 'rgba(245,158,11,0.08)', borderRadius: 6, border: '1px solid rgba(245,158,11,0.2)' }}>
          <span style={{ fontSize: 12 }}>⚠️</span>
          <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 500 }}>Risco de tsunami</span>
        </div>
      )}
    </div>
  )
}

export function EarthquakeWidget({ isFocused = false }: { isFocused?: boolean }) {
  const [minMag, setMinMag] = useState(2.5)
  const [rightTab, setRightTab] = useState<RightTab>('map')
  const [selectedQuakeId, setSelectedQuakeId] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder>('recent')
  const addAlert = useAlertsStore((s) => s.addAlert)

  const { data: quakes, isLoading, error, refetch, dataUpdatedAt } = useEarthquakes(minMag)

  useEffect(() => {
    if (!quakes) return
    quakes
      .filter((q) => q.magnitude >= 6.0)
      .slice(0, 1)
      .forEach((q) =>
        addAlert({
          id: `earthquake-${q.id}`,
          type: 'earthquake',
          title: `Terremoto M${q.magnitude.toFixed(1)}`,
          body: q.place,
          severity: q.magnitude >= 6.5 ? 'critical' : 'warning',
          sourceWidget: 'earthquakes',
        })
      )
  }, [quakes, addAlert])

  const maxMag = quakes?.length ? Math.max(...quakes.map((q) => q.magnitude)) : 0
  const compactList = quakes?.slice(0, 10) ?? []
  const sortedQuakes = [...(quakes ?? [])].sort((a, b) => {
    if (sortOrder === 'mag-desc') return b.magnitude - a.magnitude
    if (sortOrder === 'mag-asc') return a.magnitude - b.magnitude
    return b.time - a.time // recent
  })

  const severities = quakes
    ? [
        { label: 'Severos',   color: '#f43f5e', count: quakes.filter(q => q.magnitude >= 6.5).length },
        { label: 'Fortes',    color: '#f97316', count: quakes.filter(q => q.magnitude >= 5.0 && q.magnitude < 6.5).length },
        { label: 'Moderados', color: '#f59e0b', count: quakes.filter(q => q.magnitude >= 3.5 && q.magnitude < 5.0).length },
        { label: 'Menores',   color: '#6b7280', count: quakes.filter(q => q.magnitude < 3.5).length },
      ]
    : []
  const tsunamiCount = quakes?.filter(q => q.tsunamiRisk).length ?? 0
  const scatterData =
    quakes?.map((q) => ({
      mag: parseFloat(q.magnitude.toFixed(1)),
      depth: Math.round(q.depth),
      size: q.magnitude * q.magnitude * 2,
      place: q.place,
      time: q.time,
      tsunamiRisk: q.tsunamiRisk,
      flag: getCountryFlag(q.place),
    })) ?? []

  const tabs: { id: RightTab; label: string }[] = [
    { id: 'map', label: 'Mapa' },
    { id: 'analysis', label: 'Análise' },
  ]

  return (
    <WidgetShell
      title="Atividade Sísmica"
      icon={<span className={isFocused ? 'text-2xl' : 'text-base'}>🌍</span>}
      isLoading={isLoading}
      error={error}
      onRetry={() => refetch()}
      lastUpdated={dataUpdatedAt || undefined}
      accentColor={ACCENT}
      isFocused={isFocused}
      fillHeight={isFocused}
      viewRoute="/earthquakes"
    >
      {/* ── Stats header ── */}
      {quakes && (
        <div className="flex gap-2 mb-3 flex-shrink-0">

          {/* Total de eventos */}
          <div className="flex flex-col justify-between px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] min-w-[68px]">
            <span className="text-[10px] uppercase tracking-widest text-white/25 leading-none">Eventos</span>
            <span className="text-[22px] font-mono font-bold text-white/85 leading-none mt-1.5">{quakes.length}</span>
            <span className="text-[10px] text-white/20 mt-1 leading-none">7 dias</span>
          </div>

          {/* Maior magnitude */}
          <div
            className="flex flex-col justify-between px-3 py-2.5 rounded-xl border min-w-[68px]"
            style={{ background: magColor(maxMag) + '0f', borderColor: magColor(maxMag) + '35' }}
          >
            <span className="text-[10px] uppercase tracking-widest leading-none" style={{ color: magColor(maxMag) + 'aa' }}>Maior</span>
            <span className="text-[22px] font-mono font-bold leading-none mt-1.5" style={{ color: magColor(maxMag) }}>
              M{maxMag.toFixed(1)}
            </span>
            <span className="text-[10px] mt-1 leading-none" style={{ color: magColor(maxMag) + '99' }}>
              {magLabel(maxMag)}{tsunamiCount > 0 && <span className="ml-1.5 text-amber-400">⚠ {tsunamiCount}</span>}
            </span>
          </div>

          {/* Distribuição de severidade — só no modo expandido */}
          {isFocused && (
            <div className="flex-1 flex flex-col justify-between px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] min-w-0">
              <span className="text-[10px] uppercase tracking-widest text-white/25 leading-none">Distribuição</span>

              {/* Barra proporcional */}
              <div className="flex h-1.5 rounded-full overflow-hidden gap-px mt-2">
                {severities.map(({ color, count }) =>
                  count > 0 ? (
                    <div
                      key={color}
                      style={{ background: color, flex: count, opacity: 0.75 }}
                    />
                  ) : null
                )}
              </div>

              {/* Legenda */}
              <div className="flex gap-3 mt-2 flex-wrap">
                {severities.map(({ label, color, count }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                    <span className="text-[10px] text-white/35 whitespace-nowrap">
                      <span className="font-mono text-white/55">{count}</span> {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filtro de magnitude */}
          <div className="flex flex-col justify-between px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] min-w-[110px]">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[10px] uppercase tracking-widest text-white/25 leading-none">Filtro</span>
              <span className="text-[11px] font-mono text-white/55 leading-none">M≥{minMag}</span>
            </div>
            <input
              type="range" min={1} max={6} step={0.5} value={minMag}
              onChange={(e) => setMinMag(Number(e.target.value))}
              className="eq-slider w-full cursor-pointer"
              style={{ accentColor: ACCENT }}
            />
            <div className="flex justify-between">
              <span className="text-[9px] text-white/18">M1</span>
              <span className="text-[9px] text-white/18">M6</span>
            </div>
          </div>

        </div>
      )}

      {/* ── MODO COMPACTO ── */}
      {!isFocused && (
        <div className="flex flex-col gap-0.5 overflow-hidden">
          {compactList.map((quake, i) => (
            <motion.a
              key={quake.id}
              href={quake.url} target="_blank" rel="noopener noreferrer"
              initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-white/4 transition-colors group"
            >
              <div
                className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0"
                style={{ background: magColor(quake.magnitude) + '18', border: `1px solid ${magColor(quake.magnitude)}30` }}
              >
                <span className="text-sm font-mono font-bold" style={{ color: magColor(quake.magnitude) }}>
                  {quake.magnitude.toFixed(1)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-white/75 truncate group-hover:text-white/90">{quake.place}</div>
                <div className="flex gap-2 mt-0.5 text-[12px] text-white/30">
                  <span>{magLabel(quake.magnitude)}</span>
                  <span>·</span>
                  <span>{quake.depth.toFixed(0)} km</span>
                  <span>·</span>
                  <span>{formatRelativeTime(Math.floor(quake.time / 1000))}</span>
                  {quake.tsunamiRisk && <span className="text-amber-400">⚠️</span>}
                </div>
              </div>
            </motion.a>
          ))}
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
          {/* Coluna esquerda — lista */}
          <div className="w-64 flex-shrink-0 flex flex-col min-h-0">
            {/* Ordenação */}
            <div className="flex gap-1 mb-2 flex-shrink-0">
              {([
                { id: 'recent',   label: 'Recente' },
                { id: 'mag-desc', label: 'M↓' },
                { id: 'mag-asc',  label: 'M↑' },
              ] as { id: SortOrder; label: string }[]).map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSortOrder(opt.id)}
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium transition-all"
                  style={{
                    background: sortOrder === opt.id ? 'rgba(255,255,255,0.08)' : 'transparent',
                    color: sortOrder === opt.id ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.28)',
                    border: `1px solid ${sortOrder === opt.id ? 'rgba(255,255,255,0.12)' : 'transparent'}`,
                  }}
                >
                  {opt.label}
                </button>
              ))}
              <span className="ml-auto text-[11px] text-white/20 self-center pr-0.5">
                {sortedQuakes.length}
              </span>
            </div>

            {/* Lista scrollável */}
            <div className="flex flex-col gap-0.5 overflow-y-auto flex-1 min-h-0 pr-0.5">
              {sortedQuakes.map((quake, i) => {
                const isSelected = selectedQuakeId === quake.id
                const flag = getCountryFlag(quake.place)
                return (
                  <motion.div
                    key={quake.id}
                    initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.018, 0.25) }}
                    onClick={() => { setSelectedQuakeId(quake.id); setRightTab('map') }}
                    className="flex items-center gap-2 py-1.5 px-2 rounded-lg transition-colors group flex-shrink-0 cursor-pointer hover:bg-white/4"
                    style={{
                      background: isSelected ? magColor(quake.magnitude) + '14' : undefined,
                      outline: isSelected ? `1px solid ${magColor(quake.magnitude)}38` : 'none',
                    }}
                  >
                    <div
                      className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0"
                      style={{ background: magColor(quake.magnitude) + '18', border: `1px solid ${magColor(quake.magnitude)}28` }}
                    >
                      <span className="text-xs font-mono font-bold" style={{ color: magColor(quake.magnitude) }}>
                        {quake.magnitude.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {flag && (
                          <span className="text-[13px] leading-none flex-shrink-0 opacity-80">{flag}</span>
                        )}
                        <div className="text-[12px] text-white/70 truncate group-hover:text-white/90 leading-tight">
                          {quake.place}
                        </div>
                      </div>
                      <div className="text-[11px] text-white/28 mt-0.5">
                        {quake.depth.toFixed(0)} km · {formatRelativeTime(Math.floor(quake.time / 1000))}
                        {quake.tsunamiRisk && <span className="ml-1 text-amber-400">⚠️</span>}
                      </div>
                    </div>
                    <a
                      href={quake.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex-shrink-0 opacity-0 group-hover:opacity-40 hover:!opacity-80 transition-opacity text-white text-[13px] px-1"
                      title="Ver no USGS"
                    >
                      ↗
                    </a>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Divisor */}
          <div className="w-px bg-white/6 flex-shrink-0" />

          {/* Coluna direita */}
          <div className="flex-1 min-w-0 flex flex-col gap-3">
            {/* Tabs */}
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

            {/* Painéis — ambos sempre no DOM, só alternam visibilidade */}
            <div className="flex-1 min-h-0" style={{ position: 'relative' }}>

              {/* Mapa — sempre montado, nunca desmonta */}
              {quakes && quakes.length > 0 && (
                <LeafletMap quakes={quakes} isActive={rightTab === 'map'} selectedQuakeId={selectedQuakeId} />
              )}

              {/* Análise — também sempre no DOM */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  opacity: rightTab === 'analysis' ? 1 : 0,
                  pointerEvents: rightTab === 'analysis' ? 'auto' : 'none',
                  transition: 'opacity 0.2s ease',
                }}
              >
                <div className="flex-1 min-h-0" style={{ position: 'relative' }}>
                  <p className="text-xs text-white/40 uppercase tracking-widest" style={{ position: 'absolute', top: 0, left: 0 }}>
                    Magnitude × Profundidade
                  </p>
                <div style={{
                  position: 'absolute', inset: 0, top: 22,
                  background: '#06080f',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.06)',
                  backgroundImage: [
                    'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)',
                    'linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
                  ].join(','),
                  backgroundSize: '48px 48px',
                  overflow: 'hidden',
                }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 16, right: 20, left: -12, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="0" stroke="transparent" />
                      <XAxis
                        dataKey="depth" name="Profundidade" unit=" km"
                        type="number" domain={[0, 'dataMax']}
                        tickCount={6} allowDecimals={false}
                        tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 11 }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickLine={false}
                      />
                      <YAxis
                        dataKey="mag" name="Magnitude"
                        type="number" domain={[0, 'dataMax']}
                        tickCount={5} allowDecimals={false}
                        tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 11 }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickLine={false}
                      />
                      <ZAxis dataKey="size" range={[20, 200]} />
                      <Tooltip content={<ScatterTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.15)' }} />
                      <Scatter data={scatterData} fill={ACCENT} fillOpacity={0.7} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                </div>
                <div className="flex gap-4 flex-shrink-0">
                  {[
                    { label: '< 3.5', color: '#6b7280' },
                    { label: '3.5–5.0', color: '#f59e0b' },
                    { label: '5.0–6.5', color: '#f97316' },
                    { label: '≥ 6.5', color: '#f43f5e' },
                  ].map(({ label, color }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                      <span className="text-[11px] text-white/40">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </WidgetShell>
  )
}
