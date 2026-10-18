import { useId, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { MapInspection } from '@/components/geo/dot-map'
import { DotMap } from '@/components/geo/dot-map'
import type { GeoMarker } from '@/components/geo/dot-grid'
import { Cell, DataTable, TableRow } from '@/components/terminal/data-table'
import { TWO_PANE } from '@/components/terminal/grid'
import { QueryPanel } from '@/components/terminal/query-panel'
import { tabId, tabPanelId } from '@/components/terminal/tab-ids'
import { Tabs } from '@/components/terminal/tabs'
import { BlockBar, EmptyState, ToneText } from '@/components/terminal/text'
import { QuakeDistribution, QuakeLegend } from '@/features/earthquakes/components/quake-scale'
import { useEarthquakes } from '@/features/earthquakes/api/usgs'
import {
  DEPTH_RANGES, depthHistogram, formatLonLat, QUAKE_BANDS_DOWN, QUAKE_SCALE, quakeBandCounts, quakeGlyph, quakeTone, shallowShare, shortPlace, sortQuakes, type QuakeSort,
} from '@/features/earthquakes/lib/quake-terminal'
import type { Earthquake } from '@/features/earthquakes/types'
import { useNow } from '@/hooks/use-now'
import { formatAge } from '@/lib/terminal-format'

type QuakeView = 'map' | 'analysis'
const VIEWS: QuakeView[] = ['map', 'analysis']
const SORTS: QuakeSort[] = ['recent', 'magnitudeDown', 'magnitudeUp']
const MIN_MAGNITUDE = 2.5
const LIST_ROWS = 16
const PHONE_LIST_ROWS = 6
const LIST_COLUMNS = '32px minmax(0,1fr) 48px 36px'

const depthLabel = ([from, to]: readonly [number, number]) => (to === Infinity ? `> ${from} km` : `${from}–${to} km`)

function QuakeList({ quakes, sort, onSort, highlightedId }: { quakes: Earthquake[]; sort: QuakeSort; onSort: (sort: QuakeSort) => void; highlightedId: string | null }) {
  const { t } = useTranslation()
  const now = useNow(1_000)
  const rows = sortQuakes(quakes, sort).slice(0, LIST_ROWS)
  const more = (shown: number) => t('terminal.planet.quakes.more', { count: quakes.length - shown })

  return (
    <div className="flex min-w-0 max-w-[440px] flex-[1_1_320px] flex-col gap-[8px]">
      <Tabs variant="text" label={t('terminal.planet.quakes.sort.label')} value={sort} onChange={onSort} items={SORTS.map((id) => ({ id, label: t(`terminal.planet.quakes.sort.${id}`) }))} />
      <DataTable columns={LIST_COLUMNS}>
        {rows.map((quake, index) => (
          <div key={quake.id} role="row" className={`contents ${index >= PHONE_LIST_ROWS ? 'max-sm:hidden' : ''}`}>
            <Cell><ToneText tone={quakeTone(quake.magnitude)}>{quake.magnitude.toFixed(1)}</ToneText></Cell>
            <Cell truncate className={quake.id === highlightedId ? 'text-info' : ''}>{quake.place}</Cell>
            <Cell right className="text-dim">{Math.round(quake.depth)} km</Cell>
            <Cell right className="text-dim">{formatAge(now - quake.time)}</Cell>
          </div>
        ))}
      </DataTable>
      {quakes.length > rows.length && <span className="text-dim max-sm:hidden">{more(rows.length)}</span>}
      {quakes.length > PHONE_LIST_ROWS && <span className="text-dim sm:hidden">{more(Math.min(rows.length, PHONE_LIST_ROWS))}</span>}
    </div>
  )
}

function QuakeMap({ quakes, inspection, onInspect }: { quakes: Earthquake[]; inspection: MapInspection | null; onInspect: (inspection: MapInspection | null) => void }) {
  const { t } = useTranslation()
  const now = useNow(1_000)
  // Smallest first so the strongest quakes are drawn on top
  const ordered = useMemo(() => sortQuakes(quakes, 'magnitudeUp'), [quakes])
  const hovered = inspection?.markerIndex == null ? null : ordered[inspection.markerIndex]
  const markers = useMemo<GeoMarker[]>(() => ordered.map((quake) => {
    const isHovered = quake === hovered
    return {
      lon: quake.location.lng,
      lat: quake.location.lat,
      glyph: quakeGlyph(quake.magnitude),
      color: isHovered ? '--color-info' : `--color-${quakeTone(quake.magnitude)}`,
      label: `${quake.magnitude.toFixed(1)} ${quake.place}`,
      labelRank: quake.magnitude,
      pinned: isHovered,
    }
  }), [ordered, hovered])

  let cursorLine = <><span className="max-sm:hidden">{t('terminal.planet.quakes.hover')}</span><span className="sm:hidden">{t('terminal.planet.quakes.tap')}</span></>
  if (inspection) {
    const coords = formatLonLat(inspection.lon, inspection.lat)
    cursorLine = <>{hovered
      ? t('terminal.planet.quakes.readout', { coords, magnitude: hovered.magnitude.toFixed(1), place: hovered.place, depth: Math.round(hovered.depth), age: formatAge(now - hovered.time) })
      : coords}</>
  }

  return (
    <>
      <DotMap label={t('terminal.planet.quakes.mapLabel')} markers={markers} onInspect={onInspect} style={{ height: 'clamp(180px, 28vw, 400px)' }} />
      <span aria-live="polite" className="text-dim">{cursorLine}</span>
      <QuakeLegend />
    </>
  )
}

function QuakeAnalysis({ quakes }: { quakes: Earthquake[] }) {
  const { t } = useTranslation()
  const largest = sortQuakes(quakes, 'magnitudeDown')[0]
  const bandCounts = quakeBandCounts(quakes)
  return (
    <>
      <span className="text-dim">{t('terminal.planet.quakes.magnitudeCount')}</span>
      <DataTable columns="auto minmax(0,1fr) 40px" gap="2px 12px">
        {QUAKE_BANDS_DOWN.map((band) => {
          const count = bandCounts[band]
          return (
            <TableRow key={band}>
              <Cell className="whitespace-nowrap">{t(`terminal.planet.quakes.bands.${band}`)} <span className="text-dim">{QUAKE_SCALE[band].range}</span></Cell>
              <Cell className="overflow-hidden">{count ? <BlockBar value={count} max={quakes.length} width={40} tone={QUAKE_SCALE[band].tone} /> : <span className="text-line">·</span>}</Cell>
              <Cell right>{count}</Cell>
            </TableRow>
          )
        })}
      </DataTable>
      <span className="text-dim">{t('terminal.planet.quakes.depthCount')}</span>
      <DataTable columns="96px minmax(0,1fr) 40px 56px" gap="2px 12px">
        {depthHistogram(quakes).map((bucket, index) => (
          <TableRow key={bucket.from}>
            <Cell>{depthLabel(DEPTH_RANGES[index])}</Cell>
            <Cell className="overflow-hidden">{bucket.count ? <BlockBar value={bucket.count} max={quakes.length} width={40} tone="land" /> : <span className="text-line">·</span>}</Cell>
            <Cell right>{bucket.count}</Cell>
            <Cell right className="text-dim">{bucket.meanMagnitude === null ? '—' : `M${bucket.meanMagnitude.toFixed(1)}`}</Cell>
          </TableRow>
        ))}
      </DataTable>
      <span className="text-dim">
        {t('terminal.planet.quakes.insight', { share: shallowShare(quakes), magnitude: largest.magnitude.toFixed(1), place: shortPlace(largest.place), depth: Math.round(largest.depth) })}
      </span>
    </>
  )
}

interface Selection {
  sort: QuakeSort
  view: QuakeView
}

function SeismicBody({ quakes, selection, onSelection }: { quakes: Earthquake[]; selection: Selection; onSelection: (patch: Partial<Selection>) => void }) {
  const { t } = useTranslation()
  const tabsId = useId()
  const [inspection, setInspection] = useState<MapInspection | null>(null)
  const ordered = useMemo(() => sortQuakes(quakes, 'magnitudeUp'), [quakes])
  if (!quakes.length) return <EmptyState title={t('terminal.planet.quakes.empty')} hint={t('terminal.planet.quakes.emptyHint')} />
  const highlightedId = inspection?.markerIndex == null ? null : ordered[inspection.markerIndex]?.id ?? null
  const { view } = selection

  return (
    <>
      <QuakeDistribution quakes={quakes} />
      <div className={TWO_PANE}>
        <QuakeList quakes={quakes} sort={selection.sort} onSort={(sort) => onSelection({ sort })} highlightedId={view === 'map' ? highlightedId : null} />
        <div className="flex min-w-0 flex-[3_1_520px] flex-col gap-[10px]">
          <Tabs label={t('terminal.planet.quakes.tabs.label')} idBase={tabsId} value={view} onChange={(id) => onSelection({ view: id })} items={VIEWS.map((id) => ({ id, label: t(`terminal.planet.quakes.tabs.${id}`) }))} />
          <div role="tabpanel" id={tabPanelId(tabsId, view)} aria-labelledby={tabId(tabsId, view)} className="flex min-w-0 flex-col gap-[10px]">
            {view === 'map' ? <QuakeMap quakes={quakes} inspection={inspection} onInspect={setInspection} /> : <QuakeAnalysis quakes={quakes} />}
          </div>
        </div>
      </div>
    </>
  )
}

/** [3.2] USGS quakes of the last 7 days: sortable list, dot map with inspection, and magnitude/depth analysis. */
export function SeismicPanel() {
  const { t } = useTranslation()
  const query = useEarthquakes(MIN_MAGNITUDE)
  const now = useNow(1_000)
  const [selection, setSelection] = useState<Selection>({ sort: 'recent', view: 'map' })
  const onSelection = (patch: Partial<Selection>) => setSelection((current) => ({ ...current, ...patch }))

  return (
    <QueryPanel
      id="3.2"
      title={t('terminal.planet.quakes.title')}
      gap={14}
      meta={`usgs · 7d · M≥${MIN_MAGNITUDE} · ${formatAge(now - query.dataUpdatedAt)}`}
      query={query}
      source="usgs"
    >
      {(quakes) => <SeismicBody quakes={quakes} selection={selection} onSelection={onSelection} />}
    </QueryPanel>
  )
}
