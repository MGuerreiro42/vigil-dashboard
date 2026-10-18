import { useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useCanvasSize } from '@/components/geo/dot-canvas'
import { DotGlobe } from '@/components/geo/dot-globe'
import type { GeoMarker, Rotation } from '@/components/geo/dot-grid'
import { Cell, DataTable, TableRow } from '@/components/terminal/data-table'
import { TWO_PANE } from '@/components/terminal/grid'
import { QueryPanel } from '@/components/terminal/query-panel'
import { Stat, StatLine } from '@/components/terminal/stat-line'
import { tabId, tabPanelId } from '@/components/terminal/tab-ids'
import { Tabs } from '@/components/terminal/tabs'
import { BlockBar, EmptyState, LegendGrid, ToneText } from '@/components/terminal/text'
import { AlertCounts } from '@/features/natural-events/components/alert-counts'
import { quakeTone } from '@/features/earthquakes/lib/quake-terminal'
import { useNaturalEvents } from '@/features/natural-events/api/gdacs'
import {
  ALERT_COLOR, ALERT_TONE, alertOf, CATEGORY_GLYPH, countBy, countryCount, depthFromDescription, EVENT_CATEGORIES, eventGlyph,
  isEventCategory, saffirSimpson, timelineAxis, timelineBuckets, timelineGrid, type AlertLevel, type EventCategory,
} from '@/features/natural-events/lib/event-terminal'
import type { NaturalEvent } from '@/features/natural-events/types'
import { useNow } from '@/hooks/use-now'
import { intlLocale } from '@/i18n'
import { formatAge } from '@/lib/terminal-format'

type EventsView = 'globe' | 'seismic' | 'timeline' | 'categories'
const VIEWS: EventsView[] = ['globe', 'seismic', 'timeline', 'categories']

const HOUR_MS = 3_600_000
const TIMELINE_DAYS = 7
const CHAR_PROBE = '0'.repeat(10)
const COUNT_CHARS = 4
const COUNT_GAP_PX = 8
const ALWAYS_SHOWN_LANES: EventCategory[] = ['wildfires', 'earthquakes', 'severeStorms', 'floods']

const FEED_ROWS = 11
const SEISMIC_ROWS = 12
const FIRE_ROWS = 7
const GLOBE_ROTATION: Rotation = [30, -8]
const ALERTS: AlertLevel[] = ['Green', 'Orange', 'Red']

const byNewest = (left: NaturalEvent, right: NaturalEvent) => new Date(right.date).getTime() - new Date(left.date).getTime()
const ofCategory = (events: NaturalEvent[], category: EventCategory) => events.filter((event) => event.categoryId === category)

function useAge() {
  const now = useNow(1_000)
  return (date: string) => formatAge(now - new Date(date).getTime())
}

function AlertWord({ level }: { level: AlertLevel }) {
  const { t } = useTranslation()
  return <ToneText tone={ALERT_TONE[level]}>{t(`terminal.planet.events.alerts.${level}`)}</ToneText>
}

function EventsGlobe({ events }: { events: NaturalEvent[] }) {
  const { t } = useTranslation()
  const markers = useMemo<GeoMarker[]>(
    () => events.map((event) => ({ lon: event.lng, lat: event.lat, glyph: eventGlyph(event), color: ALERT_COLOR[alertOf(event)] })),
    [events],
  )
  return (
    <>
      <div className="flex justify-center">
        <DotGlobe label={t('terminal.planet.events.globeLabel')} markers={markers} initialRotation={GLOBE_ROTATION} autoRotate className="aspect-square h-auto w-[440px] max-w-full" />
      </div>
      <div className="flex flex-col gap-[8px] max-sm:gap-[12px]">
        <LegendGrid minItem={110} className="max-sm:grid-cols-3!">
          {EVENT_CATEGORIES.map((category) => (
            <span key={category}><span className="font-semibold">{CATEGORY_GLYPH[category]}</span> {t(`terminal.planet.events.singular.${category}`)}</span>
          ))}
        </LegendGrid>
        <div className="flex flex-wrap justify-between gap-x-[16px] gap-y-[4px] max-sm:flex-col max-sm:gap-y-[12px]">
          <span className="flex flex-wrap gap-x-[14px] gap-y-[4px]">
            <span className="text-dim">{t('terminal.planet.events.alertLegend')}</span>
            {ALERTS.map((level) => <AlertWord key={level} level={level} />)}
          </span>
          <span className="text-dim">{t('terminal.planet.events.dragHint')}</span>
        </div>
      </div>
    </>
  )
}

function SeismicView({ quakes }: { quakes: NaturalEvent[] }) {
  const { t } = useTranslation()
  const age = useAge()
  if (!quakes.length) return <EmptyState title={t('terminal.planet.events.noQuakes')} hint={t('terminal.planet.events.noQuakesHint')} />
  const rows = [...quakes].sort((left, right) => (right.magnitude ?? 0) - (left.magnitude ?? 0)).slice(0, SEISMIC_ROWS)
  const columns = 'terminal.planet.events.columns'
  return (
    <DataTable
      columns="36px minmax(0,1fr) 80px 40px"
      gap="2px 12px"
      header={[{ label: t(`${columns}.magnitude`) }, { label: t(`${columns}.place`) }, { label: t(`${columns}.depth`), right: true }, { label: t(`${columns}.age`), right: true }]}
    >
      {rows.map((quake) => {
        const depth = depthFromDescription(quake.description)
        return (
          <TableRow key={quake.id}>
            <Cell><ToneText tone={quakeTone(quake.magnitude ?? 0)}>{(quake.magnitude ?? 0).toFixed(1)}</ToneText></Cell>
            <Cell truncate>{quake.country ?? quake.title}</Cell>
            <Cell right className="text-dim">{depth === null ? '—' : `${depth} km`}</Cell>
            <Cell right className="text-dim">{age(quake.date)}</Cell>
          </TableRow>
        )
      })}
    </DataTable>
  )
}

function TimelineView({ events }: { events: NaturalEvent[] }) {
  const { t } = useTranslation()
  const now = useNow(60_000)
  const trackRef = useRef<HTMLSpanElement>(null)
  const probeRef = useRef<HTMLSpanElement>(null)
  const trackWidth = useCanvasSize(trackRef).width
  const charWidth = useCanvasSize(probeRef).width / CHAR_PROBE.length
  // The count sits right after the dots, so it is taken out of the measured track
  const { columns, hours } = timelineGrid(trackWidth - COUNT_CHARS * charWidth - COUNT_GAP_PX, charWidth, TIMELINE_DAYS)
  const windowMs = columns * hours * HOUR_MS
  const lanes = EVENT_CATEGORIES.filter((category) => ALWAYS_SHOWN_LANES.includes(category) || ofCategory(events, category).length > 0)
  const inWindow = (event: NaturalEvent) => {
    const age = now - new Date(event.date).getTime()
    return age >= 0 && age < windowMs
  }

  return (
    <div className="flex flex-col gap-[12px]">
      <div className="grid gap-x-[8px] gap-y-[10px] whitespace-pre sm:gap-x-[12px]" style={{ gridTemplateColumns: 'auto minmax(0,1fr)' }}>
        {lanes.map((category) => {
          const laneEvents = ofCategory(events, category)
          return <LaneRow key={category} category={category} count={laneEvents.filter(inWindow).length} buckets={timelineBuckets(laneEvents, now, columns, hours * HOUR_MS)} />
        })}
        <span />
        <span ref={trackRef} className="relative overflow-hidden text-dim" aria-hidden>
          {timelineAxis(columns, hours, t('terminal.planet.now'), (count) => t('terminal.planet.daysAgo', { count }))}
          <span ref={probeRef} className="invisible absolute left-0 inline-block">{CHAR_PROBE}</span>
        </span>
      </div>
      <LegendGrid minItem={180} className="text-dim">
        <span>{t('terminal.planet.events.timelineNote.bucket', { hours })}</span>
        <span>{t('terminal.planet.events.timelineNote.mark')}</span>
        <span>{t('terminal.planet.events.timelineNote.colour')}</span>
      </LegendGrid>
    </div>
  )
}

function LaneRow({ category, count, buckets }: { category: EventCategory; count: number; buckets: (AlertLevel | null)[] }) {
  const { t } = useTranslation()
  const name = t(`terminal.planet.events.categories.${category}`)
  return (
    <>
      <span className="text-dim">{CATEGORY_GLYPH[category]}<span className="max-sm:hidden"> {name}</span></span>
      <span className="flex min-w-0" style={{ gap: COUNT_GAP_PX }}>
        <span className="overflow-hidden" role="img" aria-label={name}>
          {buckets.map((level, index) => (level ? <ToneText key={index} tone={ALERT_TONE[level]}>●</ToneText> : <span key={index} className="text-rim">·</span>))}
        </span>
        <span className="shrink-0 text-right text-dim" style={{ width: `${COUNT_CHARS}ch` }}>{count}</span>
      </span>
    </>
  )
}

function SectionCaption({ children }: { children: ReactNode }) {
  return <span className="text-dim max-sm:text-text">{children}</span>
}

function CategoriesView({ events }: { events: NaturalEvent[] }) {
  const { t } = useTranslation()
  const age = useAge()
  const locale = intlLocale()
  const counts = [...countBy(events.filter((event) => isEventCategory(event.categoryId)), (event) => event.categoryId)].sort((left, right) => right[1] - left[1])
  const maxCount = counts[0]?.[1] ?? 0
  const fires = ofCategory(events, 'wildfires')
    .filter((fire) => fire.magnitudeUnit === 'hectare' && fire.magnitude)
    .sort((left, right) => (right.magnitude ?? 0) - (left.magnitude ?? 0))
    .slice(0, FIRE_ROWS)
  const largestFire = fires[0]?.magnitude ?? 0
  const storms = ofCategory(events, 'severeStorms').sort(byNewest)

  return (
    <>
      <DataTable columns="24px 120px minmax(0,1fr) 40px" gap="2px 12px">
        {counts.map(([category, count]) => (
          <TableRow key={category}>
            <Cell>{CATEGORY_GLYPH[category as EventCategory]}</Cell>
            <Cell truncate>{t(`terminal.planet.events.categories.${category as EventCategory}`)}</Cell>
            <Cell className="overflow-hidden"><BlockBar value={count} max={maxCount} width={32} tone="land" /></Cell>
            <Cell right>{count}</Cell>
          </TableRow>
        ))}
      </DataTable>

      {fires.length > 0 && (
        <>
          <SectionCaption>{t('terminal.planet.events.largestFires')}</SectionCaption>
          <DataTable columns="20px 120px minmax(0,1fr) minmax(64px,auto)" gap="2px 12px">
            {fires.map((fire, index) => (
              <TableRow key={fire.id}>
                <Cell className="text-dim">{index + 1}</Cell>
                <Cell truncate>{fire.country ?? fire.title}</Cell>
                <Cell className="overflow-hidden"><BlockBar value={fire.magnitude ?? 0} max={largestFire} width={36} tone="warn" /></Cell>
                <Cell right>{Math.round(fire.magnitude ?? 0).toLocaleString(locale)} ha</Cell>
              </TableRow>
            ))}
          </DataTable>
        </>
      )}

      <SectionCaption>{t('terminal.planet.events.activeStorms')}</SectionCaption>
      {storms.length === 0 ? <span>{t('terminal.planet.events.noStorms')}</span> : (
        <DataTable columns="auto minmax(0,1fr) auto auto auto" gap="2px 12px">
          {storms.map((storm) => {
            const knots = storm.magnitudeUnit === 'kts' ? storm.magnitude : null
            return (
              <TableRow key={storm.id}>
                <Cell>{storm.eventName ?? storm.title}</Cell>
                <Cell truncate>{storm.country}</Cell>
                <Cell className="text-dim">{age(storm.date)}</Cell>
                <Cell right className="text-err">{knots === null ? '—' : `${knots} kts`}</Cell>
                <Cell className="text-err">{knots === null ? '' : saffirSimpson(knots)}</Cell>
              </TableRow>
            )
          })}
        </DataTable>
      )}
    </>
  )
}

function feedName(event: NaturalEvent) {
  const place = event.country || event.title
  return event.categoryId === 'severeStorms' && event.eventName ? `${place} · ${event.eventName}` : place
}

function EventFeed({ events }: { events: NaturalEvent[] }) {
  const { t } = useTranslation()
  const age = useAge()
  return (
    <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-[4px]">
      <div className="flex justify-between text-dim"><span>{t('terminal.planet.events.feed')}</span><span>{events.length}</span></div>
      {[...events].sort(byNewest).slice(0, FEED_ROWS).map((event) => (
        <div key={event.id} className="grid gap-x-[10px]" style={{ gridTemplateColumns: '16px minmax(0,1fr) auto auto' }}>
          <span>{eventGlyph(event)}</span>
          <span className="overflow-hidden text-ellipsis whitespace-nowrap">{feedName(event)}</span>
          <span className="text-right text-dim">{age(event.date)}</span>
          <AlertWord level={alertOf(event)} />
        </div>
      ))}
    </div>
  )
}

function EventsSummary({ events, quakes }: { events: NaturalEvent[]; quakes: NaturalEvent[] }) {
  const { t } = useTranslation()
  const age = useAge()
  const [topCategory, topCount] = [...countBy(events.filter((event) => isEventCategory(event.categoryId)), (event) => event.categoryId)].sort((left, right) => right[1] - left[1])[0] ?? []
  const largest = quakes.reduce<NaturalEvent | null>((best, quake) => ((quake.magnitude ?? 0) > (best?.magnitude ?? -1) ? quake : best), null)
  const latest = [...quakes].sort(byNewest)[0]

  return (
    <StatLine>
      <Stat label={t('terminal.planet.events.active')}>{events.length}</Stat>
      <Stat label={t('terminal.planet.events.countries')} priority="p2">{countryCount(events)}</Stat>
      {topCategory && <Stat label={t('terminal.planet.events.mostFrequent')} priority="p2">{t(`terminal.planet.events.categories.${topCategory as EventCategory}`)} {topCount}</Stat>}
      <Stat label={t('terminal.planet.events.highAlert')}><AlertCounts events={events} wrapOnPhones /></Stat>
      {largest && <Stat label={t('terminal.planet.events.largest')}><ToneText tone={quakeTone(largest.magnitude ?? 0)}>M{(largest.magnitude ?? 0).toFixed(1)}</ToneText> {largest.country ?? largest.title}</Stat>}
      {latest && <Stat label={t('terminal.planet.events.latest')}>{t('terminal.planet.events.latestQuake', { place: latest.country ?? latest.title })} · {age(latest.date)}</Stat>}
    </StatLine>
  )
}

function EventsBody({ events, view, onView }: { events: NaturalEvent[]; view: EventsView; onView: (view: EventsView) => void }) {
  const { t } = useTranslation()
  const tabsId = useId()
  if (!events.length) return <EmptyState title={t('terminal.planet.events.empty')} hint={t('terminal.planet.events.emptyHint')} />
  const quakes = ofCategory(events, 'earthquakes')
  const views: Record<EventsView, ReactNode> = {
    globe: <EventsGlobe events={events} />,
    seismic: <SeismicView quakes={quakes} />,
    timeline: <TimelineView events={events} />,
    categories: <CategoriesView events={events} />,
  }

  return (
    <>
      <EventsSummary events={events} quakes={quakes} />
      <div className={TWO_PANE}>
        <div className="flex min-w-0 flex-[3_1_560px] flex-col gap-[12px]">
          <Tabs
            label={t('terminal.planet.events.tabs.label')}
            idBase={tabsId}
            value={view}
            onChange={onView}
            items={VIEWS.map((id) => ({ id, label: t(`terminal.planet.events.tabs.${id}`, { count: quakes.length }) }))}
          />
          <div role="tabpanel" id={tabPanelId(tabsId, view)} aria-labelledby={tabId(tabsId, view)} className="flex min-w-0 flex-col gap-[12px]">
            {views[view]}
          </div>
        </div>
        <EventFeed events={events} />
      </div>
    </>
  )
}

/** [3.1] GDACS events: globe, alerted quakes, 7-day timeline, categories, and the live feed. */
export function NaturalEventsPanel() {
  const { t } = useTranslation()
  const query = useNaturalEvents()
  const now = useNow(1_000)
  // Kept here so a failed refetch, which swaps the panel frame, does not reset the tab
  const [view, setView] = useState<EventsView>('globe')

  return (
    <QueryPanel id="3.1" title={t('terminal.planet.events.title')} gap={14} meta={`gdacs · ${formatAge(now - query.dataUpdatedAt)}`} query={query} source="gdacs">
      {(events) => <EventsBody events={events} view={view} onView={setView} />}
    </QueryPanel>
  )
}
