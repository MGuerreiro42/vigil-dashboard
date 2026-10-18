import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChartLegend } from '@/components/terminal/chart-legend'
import { Cell, DataTable, TableRow } from '@/components/terminal/data-table'
import { SPACE_SPAN } from '@/components/terminal/grid'
import { combineQueries } from '@/components/terminal/panel-state'
import { QueryPanel } from '@/components/terminal/query-panel'
import { Stat, StatLine } from '@/components/terminal/stat-line'
import { EmptyState, ExternalLink, LegendGrid, MetaLine, ToneText } from '@/components/terminal/text'
import { TONE_CLASS } from '@/components/terminal/tone'
import { useNearEarthObjects } from '@/features/space/api/asteroids'
import { useUpcomingLaunches } from '@/features/space/api/launches'
import { useKpIndex, useSpaceAlerts } from '@/features/space/api/space-weather'
import { useSpaceNews } from '@/features/space/api/spaceflight-news'
import { formatCountdown } from '@/features/space/lib/countdown'
import { auroraLatitude, kpToScale } from '@/features/space/lib/geomagnetic'
import { asteroidLabel, formatKp, kpColumn, kpTone, launchStatus, meanDiameter, noaaTag } from '@/features/space/lib/space-terminal'
import type { KpReading, Launch, NearEarthObject, SpaceAlert, SpaceArticle } from '@/features/space/types'
import { useNow } from '@/hooks/use-now'
import { intlLocale } from '@/i18n'
import { formatAge, formatClock, formatDayMonth, formatShortDate } from '@/lib/terminal-format'

const LIST_LAUNCHES = 7
const PHONE_KP_COLUMNS = 36
const KP_HOURS_PER_COLUMN = 3
const ASTEROID_ROWS = 10
const NEWS_ITEMS = 6

const launchDate = (iso: string, locale: string) => {
  const date = new Date(iso)
  return `${formatShortDate(date, locale)} ${formatClock(date)}`
}
// "Cape Canaveral SFS, FL, USA" → "Cape Canaveral SFS"
const shortPad = (pad: string | null) => pad?.split(',')[0] ?? null

function LaunchCountdown({ net }: { net: string }) {
  const { t } = useTranslation()
  const now = useNow(1_000)
  const remaining = formatCountdown(new Date(net).getTime(), now)
  return <span className="text-count font-semibold text-info">{remaining ? `T− ${remaining}` : t('terminal.space.launches.windowOpen')}</span>
}

function LaunchesBody({ launches, updatedAt }: { launches: Launch[]; updatedAt: number }) {
  const { t } = useTranslation()
  const now = useNow(60_000)
  const locale = intlLocale()
  const [next, ...later] = launches
  if (!next) return <EmptyState title={t('terminal.space.launches.empty')} hint={t('terminal.space.launches.emptyHint', { age: formatAge(now - updatedAt, true) })} />
  const nextDate = new Date(next.net)
  const weekday = nextDate.toLocaleDateString(locale, { weekday: 'short' }).replace('.', '')
  const pad = shortPad(next.pad)

  return (
    <>
      <div className="flex flex-col gap-[2px] border-b border-line pb-[12px]">
        <span className="text-dim">{t('terminal.space.launches.next', { mission: next.mission.toLowerCase() })}</span>
        <LaunchCountdown net={next.net} />
        <MetaLine segments={[next.rocket.toLowerCase(), next.provider && { text: next.provider.toLowerCase(), priority: 'p2' }, `${weekday} ${launchDate(next.net, locale)}`.toLowerCase(), pad && { text: pad.toLowerCase(), priority: 'p2' }]} />
      </div>
      <DataTable columns="auto minmax(0,1fr) 9ch" gap="8px 14px">
        {later.slice(0, LIST_LAUNCHES).map((launch) => {
          const { status, tone } = launchStatus(launch.status)
          return (
            <TableRow key={launch.id}>
              <Cell className="text-dim">
                <span className="max-sm:hidden">{launchDate(launch.net, locale)}</span>
                <span className="sm:hidden">{formatDayMonth(new Date(launch.net), locale)} {formatClock(new Date(launch.net))}</span>
              </Cell>
              <Cell className="flex flex-col">
                <span className="overflow-hidden text-ellipsis whitespace-nowrap">{launch.mission}</span>
                <MetaLine segments={[launch.rocket, launch.provider && { text: launch.provider, priority: 'p2' }, launch.orbit && { text: launch.orbit, priority: 'p2' }]} />
              </Cell>
              <Cell><ToneText tone={tone}>{t(`terminal.space.launches.statuses.${status}`)}</ToneText></Cell>
            </TableRow>
          )
        })}
      </DataTable>
    </>
  )
}

/** [4.2] Launch Library: the next launch with a live countdown, then the following ones. */
export function LaunchesPanel() {
  const { t } = useTranslation()
  const query = useUpcomingLaunches()
  return (
    <QueryPanel id="4.2" title={t('terminal.space.launches.title')} gap={12} meta="launch library 2" query={query} source="launch library" className={SPACE_SPAN.launches}>
      {(launches) => <LaunchesBody launches={launches} updatedAt={query.dataUpdatedAt} />}
    </QueryPanel>
  )
}

function KpGrid({ readings }: { readings: KpReading[] }) {
  const { t } = useTranslation()
  const [cursor, setCursor] = useState<number | null>(null)
  const hidePhoneBefore = readings.length - PHONE_KP_COLUMNS
  const reading = cursor === null ? null : readings[cursor]
  const readout = reading && t('terminal.space.weather.readout', {
    time: launchDate(reading.time, intlLocale()),
    kp: formatKp(reading.kp, intlLocale()),
    scale: kpToScale(reading.kp),
  })

  return (
    <>
      <div
        role="img"
        aria-label={t('terminal.space.weather.chartLabel')}
        className="flex cursor-crosshair overflow-x-auto leading-none"
        // A tap pins the cursor on touch screens; only a mouse leaving clears it
        onPointerLeave={(event) => { if (event.pointerType === 'mouse') setCursor(null) }}
      >
        {readings.map((entry, index) => (
          <div
            key={entry.time}
            className={`flex flex-col whitespace-pre ${index < hidePhoneBefore ? 'max-sm:hidden' : ''} ${index === cursor ? 'bg-row-selected' : ''}`}
            onPointerEnter={(event) => { if (event.pointerType === 'mouse') setCursor(index) }}
            onPointerDown={() => setCursor(index)}
          >
            {kpColumn(entry.kp).map((cell, row) => <span key={row} className={cell.tone === 'rim' ? 'text-rim' : TONE_CLASS[cell.tone]}>{cell.char}</span>)}
          </div>
        ))}
      </div>
      <ChartLegend readout={readout} />
    </>
  )
}

function SpaceWeatherBody({ readings, alerts }: { readings: KpReading[]; alerts: SpaceAlert[] }) {
  const { t } = useTranslation()
  const now = useNow(60_000)
  const locale = intlLocale()
  const latest = readings.at(-1)
  if (!latest) return <EmptyState title={t('terminal.space.weather.empty')} hint={t('terminal.space.weather.emptyHint')} />
  const scale = kpToScale(latest.kp)
  const days = (columns: number) => ((columns * KP_HOURS_PER_COLUMN) / 24).toLocaleString(locale, { maximumFractionDigits: 1 })

  return (
    <>
      <StatLine>
        <Stat label={t('terminal.space.weather.kpNow')}>
          <ToneText tone={kpTone(latest.kp)}>{formatKp(latest.kp, locale)} {scale} {t(`terminal.space.weather.scales.${scale}`)}</ToneText>
        </Stat>
        <span className="text-dim max-sm:hidden">{t('terminal.space.weather.aurora', { latitude: auroraLatitude(latest.kp) })}</span>
      </StatLine>
      <KpGrid readings={readings} />
      <LegendGrid minItem={150}>
        <span className="text-dim">
          <span className="max-sm:hidden">{t('terminal.space.weather.noteDays', { days: days(readings.length) })}</span>
          <span className="sm:hidden">{t('terminal.space.weather.noteDays', { days: days(Math.min(readings.length, PHONE_KP_COLUMNS)) })}</span>
        </span>
        <span className="text-dim">{t('terminal.space.weather.noteColumn')}</span>
        <span><ToneText tone="warn" className="font-semibold">- -</ToneText> {t('terminal.space.weather.noteThreshold')}</span>
      </LegendGrid>
      {alerts.length ? (
        <DataTable columns="auto minmax(0,1fr) auto" gap="2px 12px">
          {alerts.map((alert) => {
            const { tag, tone } = noaaTag(alert.kind)
            return (
              <TableRow key={alert.id}>
                <Cell><ToneText tone={tone}>{t(`terminal.space.weather.tags.${tag}`)}</ToneText></Cell>
                <Cell truncate>{alert.headline}</Cell>
                <Cell right className="text-dim">{formatAge(now - new Date(alert.issuedAt).getTime())}</Cell>
              </TableRow>
            )
          })}
        </DataTable>
      ) : <span className="text-dim">{t('terminal.space.weather.noBulletins')}</span>}
    </>
  )
}

/** [4.3] NOAA SWPC: current Kp with G-scale and aurora latitude, a week of Kp as text blocks, and bulletins. */
export function SpaceWeatherPanel() {
  const { t } = useTranslation()
  const query = combineQueries(useKpIndex(), useSpaceAlerts())
  return (
    <QueryPanel id="4.3" title={t('terminal.space.weather.title')} gap={12} meta="noaa swpc" query={query} source="noaa swpc" className={SPACE_SPAN.spaceWeather}>
      {([readings, alerts]) => <SpaceWeatherBody readings={readings} alerts={alerts} />}
    </QueryPanel>
  )
}

function AsteroidsBody({ objects }: { objects: NearEarthObject[] }) {
  const { t } = useTranslation()
  const locale = intlLocale()
  if (!objects.length) return <EmptyState title={t('terminal.space.asteroids.empty')} hint={t('terminal.space.asteroids.emptyHint')} />
  const columns = 'terminal.space.asteroids.columns'
  const rows = objects.slice(0, ASTEROID_ROWS)

  return (
    <>
      <DataTable
        columns="minmax(0,1fr) 3ch 6ch 5ch 5ch"
        phoneColumns="minmax(0,1fr) 3ch 6ch 5ch"
        gap="2px 12px"
        header={[
          { label: t(`${columns}.object`) },
          { label: '' },
          { label: t(`${columns}.distance`), right: true },
          { label: t(`${columns}.diameter`), right: true },
          { label: t(`${columns}.time`), right: true, priority: 'p2' },
        ]}
      >
        {rows.map((neo) => (
          <TableRow key={neo.id}>
            <Cell truncate title={neo.name}>{asteroidLabel(neo.name)}</Cell>
            <Cell className="text-warn">{neo.hazardous && 'PHA'}</Cell>
            <Cell right>{neo.missDistanceLunar.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</Cell>
            <Cell right className={neo.hazardous ? 'text-warn' : ''}>{Math.round(meanDiameter(neo)).toLocaleString(locale)}</Cell>
            <Cell right priority="p2" className="text-dim">{formatClock(new Date(neo.closestApproach))}</Cell>
          </TableRow>
        ))}
      </DataTable>
      {objects.length > rows.length && <span className="text-dim">{t('terminal.space.asteroids.more', { count: objects.length - rows.length })}</span>}
      <LegendGrid minItem={150} gap="2px 16px" className="text-dim">
        <span>{t('terminal.space.asteroids.footnotePha')}</span>
        <span>{t('terminal.space.asteroids.footnoteLd')}</span>
      </LegendGrid>
    </>
  )
}

/** [4.4] NASA NeoWs: today's close approaches, nearest first, potentially hazardous ones in amber. */
export function AsteroidsPanel() {
  const { t } = useTranslation()
  const query = useNearEarthObjects()
  return (
    <QueryPanel
      id="4.4"
      title={t('terminal.space.asteroids.title')}
      meta="nasa neows"
      query={query}
      source="nasa neows"
      cacheNote={(objects) => t('terminal.space.asteroids.summary', { count: objects.length, hazardous: objects.filter((neo) => neo.hazardous).length })}
      className={SPACE_SPAN.asteroids}
    >
      {(objects) => <AsteroidsBody objects={objects} />}
    </QueryPanel>
  )
}

function SpaceNewsBody({ articles }: { articles: SpaceArticle[] }) {
  const { t } = useTranslation()
  const now = useNow(60_000)
  if (!articles.length) return <EmptyState title={t('terminal.space.news.empty')} hint={t('terminal.space.news.emptyHint')} />
  return (
    <div className="grid gap-x-[32px] xl:grid-cols-2">
      {articles.slice(0, NEWS_ITEMS).map((article) => (
        <div key={article.id} className="flex flex-col border-t border-line-subtle py-[4px]">
          <ExternalLink href={article.url}>{article.title}</ExternalLink>
          <MetaLine segments={[article.site, t('terminal.space.ago', { age: formatAge(now - new Date(article.publishedAt).getTime()) })]} />
        </div>
      ))}
    </div>
  )
}

/** [4.5] Spaceflight News API headlines. */
export function SpaceNewsPanel() {
  const { t } = useTranslation()
  const query = useSpaceNews()
  return (
    <QueryPanel id="4.5" title={t('terminal.space.news.title')} gap={8} meta="spaceflight news api" query={query} source="spaceflight news api" className={SPACE_SPAN.news}>
      {(articles) => <SpaceNewsBody articles={articles} />}
    </QueryPanel>
  )
}
