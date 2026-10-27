import { useQuery } from '@tanstack/react-query'
import { fetchOk } from '@/lib/http'
import { queryKeys } from '@/lib/query-keys'
import type { NaturalEvent } from '@/features/natural-events/types'

// GDACS event JSON API: GeoJSON with CORS enabled, so no proxy is needed
const EVENTS_URL = 'https://www.gdacs.org/gdacsapi/api/events/geteventlist/events4app'

// GDACS event type → the category ids the widget's styling uses
const TYPE_MAP: Record<string, string> = {
  EQ: 'earthquakes',
  WF: 'wildfires',
  FL: 'floods',
  TC: 'severeStorms',
  DR: 'drought',
  VO: 'volcanoes',
}

// Alert level → proxy magnitude for point sizing when GDACS reports no severity
const ALERT_MAG: Record<string, number> = { Green: 1, Orange: 3, Red: 6 }

const KMH_TO_KNOTS = 0.539957

type AlertLevel = 'Green' | 'Orange' | 'Red'

type RawFeature = {
  geometry: { type: string; coordinates: [number, number] }
  properties: {
    eventtype: string
    eventid: number
    episodeid: number
    eventname: string
    name: string
    alertlevel: string
    iscurrent: string
    country: string
    fromdate: string
    url?: { report?: string }
    severitydata?: { severity: number; severitytext: string; severityunit: string }
  }
}

function isAlertLevel(level: string): level is AlertLevel {
  return level === 'Green' || level === 'Orange' || level === 'Red'
}

/** Severity in the units the widget expects: knots for cyclones, hectares for fires. */
function normalizeSeverity(type: string, severity: RawFeature['properties']['severitydata']) {
  if (!severity || !(severity.severity > 0)) return null
  if (type === 'TC' && severity.severityunit === 'km/h') return { magnitude: Math.round(severity.severity * KMH_TO_KNOTS), unit: 'kts' }
  if (severity.severityunit === 'ha') return { magnitude: severity.severity, unit: 'hectare' }
  return { magnitude: severity.severity, unit: severity.severityunit || (type === 'EQ' ? 'M' : null) }
}

export function parseGdacsEvents(collection: { features?: RawFeature[] }): NaturalEvent[] {
  return (collection.features ?? [])
    .filter((feature) => feature.geometry?.type === 'Point')
    .map(({ geometry, properties }) => {
      const [lng, lat] = geometry.coordinates
      const alertLevel = isAlertLevel(properties.alertlevel) ? properties.alertlevel : 'Green'
      const severity = normalizeSeverity(properties.eventtype, properties.severitydata)
      return {
        id: `gdacs-${properties.eventtype}-${properties.eventid}-${properties.episodeid}`,
        title: properties.eventname ? `${properties.eventname} – ${properties.country}` : properties.name,
        categoryId: TYPE_MAP[properties.eventtype] ?? 'manmade',
        categoryTitle: TYPE_MAP[properties.eventtype] ?? 'manmade',
        status: properties.iscurrent === 'true' ? 'open' : 'closed',
        // GDACS timestamps are UTC without a zone suffix
        date: new Date(`${properties.fromdate}Z`).toISOString(),
        lat,
        lng,
        sourceUrl: properties.url?.report ?? null,
        magnitude: severity?.magnitude ?? ALERT_MAG[alertLevel],
        magnitudeUnit: severity?.unit ?? 'alert',
        description: properties.severitydata?.severitytext.trim() || null,
        alertLevel,
        country: properties.country,
        eventName: properties.eventname || undefined,
      } satisfies NaturalEvent
    })
}

async function fetchGdacsEvents(signal: AbortSignal): Promise<NaturalEvent[]> {
  const response = await fetchOk(EVENTS_URL, 'GDACS', { signal })
  return parseGdacsEvents(await response.json())
}

export function useNaturalEvents() {
  return useQuery({
    queryKey: queryKeys.naturalEvents(),
    queryFn: ({ signal }) => fetchGdacsEvents(signal),
    staleTime: 5 * 60_000,
    refetchInterval: 10 * 60_000,
  })
}
