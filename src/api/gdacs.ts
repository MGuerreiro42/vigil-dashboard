import { useQuery } from '@tanstack/react-query'
import { fetchOk } from '@/lib/http'
import { queryKeys } from './queryKeys'
import type { NaturalEvent } from './types/natural-event'

// GDACS event type → EONET-compatible categoryId
// This keeps the widget category config working without changes
const TYPE_MAP: Record<string, string> = {
  EQ: 'earthquakes',
  WF: 'wildfires',
  FL: 'floods',
  TC: 'severeStorms',
  DR: 'drought',
  VO: 'volcanoes',
}

// Alert level → approximate magnitude proxy (for point sizing)
const ALERT_MAG: Record<string, number> = {
  Green: 1,
  Orange: 3,
  Red: 6,
}

export function parseGdacsRss(xml: string): NaturalEvent[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'application/xml')

  // Check for parse error
  const parseError = doc.querySelector('parsererror')
  if (parseError) throw new Error('GDACS: XML parse error')

  const items = doc.querySelectorAll('item')
  const events: NaturalEvent[] = []

  items.forEach((item) => {
    const getText = (tag: string, ns?: string) => {
      const el = ns
        ? item.getElementsByTagNameNS(ns, tag)[0]
        : item.querySelector(tag)
      return el?.textContent?.trim() ?? ''
    }

    const GDACS_NS = 'http://www.gdacs.org'
    const GEO_NS = 'http://www.w3.org/2003/01/geo/wgs84_pos#'

    const rawType = getText('eventtype', GDACS_NS)
    const categoryId = TYPE_MAP[rawType] ?? 'manmade'
    const alertLevel = getText('alertlevel', GDACS_NS) || 'Green'
    const country = getText('country', GDACS_NS) || getText('title').split(' in ').pop() || ''
    const eventId = getText('eventid', GDACS_NS)
    const episodeId = getText('episodeid', GDACS_NS)
    const severity = getText('severity', GDACS_NS)
    const gdacsLink = getText('link') || `https://www.gdacs.org/report.aspx?eventtype=${rawType}&eventid=${eventId}`
    const pubDate = getText('pubDate')
    const fromDate = getText('fromdate', GDACS_NS) || pubDate
    const title = getText('title')

    // Coordinates
    const latStr = getText('lat', GEO_NS)
    const lngStr = getText('long', GEO_NS)
    // Fallback: try georss:point
    let lat = parseFloat(latStr)
    let lng = parseFloat(lngStr)
    if (isNaN(lat) || isNaN(lng)) {
      const georssNS = 'http://www.georss.org/georss'
      const point = getText('point', georssNS)
      const parts = point.split(' ')
      lat = parseFloat(parts[0])
      lng = parseFloat(parts[1])
    }
    if (isNaN(lat) || isNaN(lng)) return // Skip events without coordinates

    // Magnitude from severity value attribute
    let magnitude: number | null = null
    let magnitudeUnit: string | null = null
    const severityEl = item.getElementsByTagNameNS(GDACS_NS, 'severity')[0]
    if (severityEl) {
      const val = parseFloat(severityEl.getAttribute('value') ?? '')
      const unit = severityEl.getAttribute('unit') ?? ''
      if (!isNaN(val) && val > 0) {
        magnitude = val
        magnitudeUnit = unit || (rawType === 'EQ' ? 'M' : rawType === 'TC' ? 'kts' : rawType === 'WF' ? 'hectare' : null)
      }
    }
    // Fallback: map alert level to a proxy magnitude
    if (magnitude === null) {
      magnitude = ALERT_MAG[alertLevel] ?? 1
      magnitudeUnit = 'alert'
    }

    // Build a clean title: prefer event name, fall back to severity description
    const eventNameEl = item.getElementsByTagNameNS(GDACS_NS, 'eventname')[0]
    const eventName = eventNameEl?.textContent?.trim() ?? ''
    const displayTitle = eventName
      ? `${eventName} – ${country}`
      : title.length < 120 ? title : `${rawType} Event – ${country}`

    events.push({
      id: `gdacs-${rawType}-${eventId}-${episodeId}`,
      title: displayTitle,
      categoryId,
      categoryTitle: categoryId,
      status: 'open',
      date: fromDate ? new Date(fromDate).toISOString() : new Date().toISOString(),
      lat,
      lng,
      sourceUrl: gdacsLink,
      magnitude,
      magnitudeUnit,
      description: severity || null,
      track: [],
      alertLevel: alertLevel as 'Green' | 'Orange' | 'Red',
      country,
    })
  })

  return events
}

async function fetchGdacsEvents(signal: AbortSignal): Promise<NaturalEvent[]> {
  // Proxied to gdacs.org (no CORS): Vite server.proxy in dev, Vercel rewrite in prod
  const response = await fetchOk('/api/gdacs/xml/rss.xml', 'GDACS', { signal })
  return parseGdacsRss(await response.text())
}

export function useNaturalEvents() {
  return useQuery({
    queryKey: queryKeys.naturalEvents(),
    queryFn: ({ signal }) => fetchGdacsEvents(signal),
    staleTime: 5 * 60_000,
    refetchInterval: 10 * 60_000,
  })
}
