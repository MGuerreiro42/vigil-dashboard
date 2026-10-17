import { useId, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { DotGlobe } from '@/components/geo/dot-globe'
import type { GeoMarker, GeoTrackPoint } from '@/components/geo/dot-grid'
import { Cell, DataTable, TableRow } from '@/components/terminal/data-table'
import { TWO_PANE } from '@/components/terminal/grid'
import { combineQueries } from '@/components/terminal/panel-state'
import { QueryPanel } from '@/components/terminal/query-panel'
import { tabId, tabPanelId } from '@/components/terminal/tab-ids'
import { Tabs } from '@/components/terminal/tabs'
import { LegendGrid, ToneText } from '@/components/terminal/text'
import { useISSPosition, useISSTLE } from '@/features/iss/api/iss'
import { useRegionName } from '@/features/iss/lib/use-region-name'
import { daylightShare, formatHemisphere, orbitalPeriodMinutes, propagateTrack, utcOffsetLabel, type TrackSample } from '@/features/iss/lib/iss-track'
import type { ISSPosition, ISSTLE } from '@/features/iss/types'
import { intlLocale } from '@/i18n'
import { formatShortDate } from '@/lib/terminal-format'

type IssView = 'now' | 'track' | 'tle'
const VIEWS: IssView[] = ['now', 'track', 'tle']
const GLOBE_WINDOW_MINUTES = 46
const GLOBE_STEP_MINUTES = 1.5
const TABLE_STEP_MINUTES = 9
const TABLE_ROWS = 10

type NowKey = 'over' | 'lat' | 'lon' | 'altitude' | 'speed' | 'footprint' | 'light' | 'subsolar'
const PHONE_HIDDEN: NowKey[] = ['footprint', 'subsolar']
type ElementKey = 'inclination' | 'raan' | 'eccentricity' | 'argPerigee' | 'meanAnomaly' | 'meanMotion' | 'bstar'

const trackColor = (sample: TrackSample) => (sample.minutes < 0 ? '--color-land' : sample.eclipsed ? '--color-info' : '--color-warn')
const latLon = (lon: number, lat: number) => `${Math.abs(lat).toFixed(1)}°${lat >= 0 ? 'N' : 'S'} ${Math.abs(lon).toFixed(1)}°${lon >= 0 ? 'E' : 'W'}`

function NowView({ position }: { position: ISSPosition }) {
  const { t } = useTranslation()
  const locale = intlLocale()
  const region = useRegionName(position)
  const number = (value: number, digits: number) => value.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits })
  const eclipsed = position.visibility === 'eclipsed'
  const rows: [NowKey, ReactNode][] = [
    ['over', `${region} · ${utcOffsetLabel(position.lng)}`],
    ['lat', <ToneText tone="info">{formatHemisphere(position.lat, 'N', 'S')}</ToneText>],
    ['lon', <ToneText tone="info">{formatHemisphere(position.lng, 'E', 'W')}</ToneText>],
    ['altitude', `${number(position.altitude, 1)} km`],
    ['speed', `${number(position.velocity / 3600, 2)} km/s · ${number(position.velocity, 0)} km/h`],
    ['footprint', `${number(position.footprint, 0)} km`],
    ['light', <ToneText tone={eclipsed ? 'info' : 'warn'}>{t(eclipsed ? 'terminal.space.iss.eclipsed' : 'terminal.space.iss.daylight')}</ToneText>],
    ['subsolar', <ToneText tone="dim">{formatHemisphere(position.solarLat, 'N', 'S')} · {formatHemisphere(position.solarLng, 'E', 'W', 1)}</ToneText>],
  ]
  return (
    <>
      <DataTable columns="96px minmax(0,1fr)" gap="3px 12px">
        {rows.map(([key, value]) => (
          <TableRow key={key} priority={PHONE_HIDDEN.includes(key) ? 'p2' : 'p1'}>
            <Cell className="text-dim">{t(`terminal.space.iss.${key}`)}</Cell>
            <Cell>{value}</Cell>
          </TableRow>
        ))}
      </DataTable>
      <LegendGrid minItem={150}>
        <span><ToneText className="font-semibold" tone="info">+</ToneText> iss</span>
        <span><ToneText className="font-semibold" tone="info">·</ToneText> {t('terminal.space.iss.legendNext')}</span>
        <span><ToneText className="font-semibold" tone="land">·</ToneText> {t('terminal.space.iss.legendLast')}</span>
      </LegendGrid>
    </>
  )
}

function TrackView({ tle, at }: { tle: ISSTLE; at: number }) {
  const { t } = useTranslation()
  const period = orbitalPeriodMinutes(tle.meanMotion)
  const { orbit, rows } = useMemo(() => ({
    orbit: propagateTrack(tle.line1, tle.line2, at, 1, period, 1),
    rows: propagateTrack(tle.line1, tle.line2, at, TABLE_STEP_MINUTES, TABLE_STEP_MINUTES * TABLE_ROWS, TABLE_STEP_MINUTES),
  }), [tle.line1, tle.line2, at, period])
  const dayShare = daylightShare(orbit)
  return (
    <>
      <span>
        {t('terminal.space.iss.nextOrbit', { minutes: Math.round(period) })} · <ToneText tone="warn">{t('terminal.space.iss.dayShare', { share: dayShare })}</ToneText> · <ToneText tone="info">{t('terminal.space.iss.nightShare', { share: 100 - dayShare })}</ToneText>
      </span>
      <DataTable columns="52px minmax(0,1fr) 52px" gap="2px 12px">
        {rows.map((sample) => (
          <TableRow key={sample.minutes}>
            <Cell className="text-dim">+{sample.minutes}m</Cell>
            <Cell>{latLon(sample.lon, sample.lat)}</Cell>
            <Cell><ToneText tone={sample.eclipsed ? 'info' : 'warn'}>{t(sample.eclipsed ? 'terminal.space.iss.night' : 'terminal.space.iss.day')}</ToneText></Cell>
          </TableRow>
        ))}
      </DataTable>
    </>
  )
}

function TleView({ tle }: { tle: ISSTLE }) {
  const { t } = useTranslation()
  const epoch = new Date(Date.UTC(tle.epochYear, 0, 1) + (tle.epochDay - 1) * 86_400_000)
  const period = orbitalPeriodMinutes(tle.meanMotion).toFixed(2)
  const rows: [ElementKey, string][] = [
    ['inclination', `${tle.inclination.toFixed(4)}°`],
    ['raan', `${tle.raan.toFixed(4)}°`],
    ['eccentricity', tle.eccentricity.toFixed(7)],
    ['argPerigee', `${tle.argPerigee.toFixed(4)}°`],
    ['meanAnomaly', `${tle.meanAnomaly.toFixed(4)}°`],
    ['meanMotion', `${tle.meanMotion.toFixed(5)} ${t('terminal.space.iss.revPerDay')}`],
    ['bstar', tle.bstar.toExponential(3)],
  ]
  return (
    <>
      <span className="text-dim">{t('terminal.space.iss.tleEpoch', { date: `${formatShortDate(epoch, intlLocale())} ${tle.epochYear}`, day: tle.epochDay.toFixed(5) })}</span>
      <DataTable columns="112px minmax(0,1fr)" gap="2px 12px">
        {rows.map(([key, value]) => (
          <TableRow key={key}>
            <Cell className="text-dim">{t(`terminal.space.iss.elements.${key}.label`)}</Cell>
            <Cell>{value} <span className="text-dim">{t(`terminal.space.iss.elements.${key}.note`, { minutes: period })}</span></Cell>
          </TableRow>
        ))}
      </DataTable>
    </>
  )
}

function IssBody({ position, tle }: { position: ISSPosition; tle: ISSTLE }) {
  const { t } = useTranslation()
  const tabsId = useId()
  const [view, setView] = useState<IssView>('now')
  const at = position.timestamp * 1000

  const track = useMemo<GeoTrackPoint[]>(
    () => propagateTrack(tle.line1, tle.line2, at, -GLOBE_WINDOW_MINUTES, GLOBE_WINDOW_MINUTES, GLOBE_STEP_MINUTES).map((sample) => ({ lon: sample.lon, lat: sample.lat, color: trackColor(sample) })),
    [tle.line1, tle.line2, at],
  )
  const markers = useMemo<GeoMarker[]>(
    () => [{ lon: position.lng, lat: position.lat, glyph: '+', color: '--color-info', label: `ISS ${formatHemisphere(position.lat, 'N', 'S')}` }],
    [position.lng, position.lat],
  )
  const focus = useMemo(() => ({ lon: position.lng, lat: position.lat }), [position.lng, position.lat])

  return (
    <div className={TWO_PANE}>
      <div className="flex min-w-0 flex-[3_1_480px] justify-center">
        <DotGlobe
          label={t('terminal.space.iss.globeLabel')}
          markers={markers}
          track={track}
          landColor="--color-land-iss"
          initialRotation={[-position.lng, -position.lat]}
          focus={focus}
          className="aspect-square w-[460px] max-w-full"
        />
      </div>
      <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-[12px]">
        <Tabs label={t('terminal.space.iss.tabs.label')} idBase={tabsId} value={view} onChange={setView} items={VIEWS.map((id) => ({ id, label: t(`terminal.space.iss.tabs.${id}`) }))} />
        <div role="tabpanel" id={tabPanelId(tabsId, view)} aria-labelledby={tabId(tabsId, view)} className="flex min-w-0 flex-col gap-[12px]">
          {view === 'now' && <NowView position={position} />}
          {view === 'track' && <TrackView tle={tle} at={at} />}
          {view === 'tle' && <TleView tle={tle} />}
        </div>
      </div>
    </div>
  )
}

/** [4.1] ISS on a dot globe that follows it, with the SGP4 track from the TLE, live telemetry, next orbit and elements. */
export function IssPanel() {
  const { t } = useTranslation()
  const query = combineQueries(useISSPosition(), useISSTLE())
  return (
    <QueryPanel id="4.1" title={t('terminal.space.iss.title')} gap={14} meta={t('terminal.space.iss.meta')} query={query} source="wheretheiss.at">
      {([position, tle]) => <IssBody position={position} tle={tle} />}
    </QueryPanel>
  )
}
