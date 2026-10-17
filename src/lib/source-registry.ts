import type { Failure } from '@/lib/http'
import type { SourceHealth, StreamHealth } from '@/store/source-health-store'

export interface SourceEntry {
  /** Name in the [1.2] list */
  label: string
  /** Short name in the brief's source column */
  short: string
  /** Screen the source feeds, for brief rows */
  screen: number
  /** Names the source's requests report to the health store through `fetchOk` */
  fetchNames?: string[]
  /** Stream name in the health store, for push sources */
  stream?: string
  /** Query key prefixes whose cached data the source fills */
  queryKeys?: string[][]
}

// Stream names repeated here (not imported) so this module stays free of feature code
export const SOURCE_REGISTRY: SourceEntry[] = [
  { label: 'binance ws', short: 'binance', screen: 2, stream: 'binance ws' },
  { label: 'coingecko', short: 'gecko', screen: 2, fetchNames: ['CoinGecko'], queryKeys: [['crypto']] },
  { label: 'frankfurter · bce', short: 'bce', screen: 2, fetchNames: ['Frankfurter'], queryKeys: [['economy', 'fx']] },
  { label: 'bcb · sgs', short: 'bcb', screen: 2, fetchNames: ['Banco Central'], queryKeys: [['economy', 'bcb']] },
  { label: 'alternative.me', short: 'f&g', screen: 2, fetchNames: ['Alternative.me'], queryKeys: [['economy', 'fear-greed']] },
  { label: 'coinpaprika', short: 'paprika', screen: 2, fetchNames: ['Coinpaprika'], queryKeys: [['economy', 'crypto-global']] },
  { label: 'mempool.space', short: 'mempool', screen: 2, fetchNames: ['mempool.space'], queryKeys: [['economy', 'bitcoin-fees']] },
  { label: 'usgs', short: 'usgs', screen: 3, fetchNames: ['USGS'], queryKeys: [['earthquakes']] },
  { label: 'gdacs', short: 'gdacs', screen: 3, fetchNames: ['GDACS'], queryKeys: [['natural-events']] },
  { label: 'open-meteo', short: 'meteo', screen: 3, fetchNames: ['Open-Meteo', 'Open-Meteo AQ', 'Open-Meteo Geocoding'], queryKeys: [['weather'], ['air-quality'], ['city-search']] },
  { label: 'rainviewer', short: 'radar', screen: 3, fetchNames: ['RainViewer'], queryKeys: [['radar-frames']] },
  { label: 'wheretheiss.at', short: 'iss', screen: 4, fetchNames: ['ISS', 'ISS coordinates', 'ISS TLE'], queryKeys: [['iss']] },
  { label: 'launch library', short: 'll2', screen: 4, fetchNames: ['Launch Library'], queryKeys: [['space', 'launches']] },
  { label: 'noaa swpc', short: 'noaa', screen: 4, fetchNames: ['NOAA SWPC'], queryKeys: [['space', 'kp-index'], ['space', 'alerts']] },
  { label: 'nasa neows', short: 'nasa', screen: 4, fetchNames: ['NASA NeoWs'], queryKeys: [['space', 'asteroids']] },
  { label: 'spaceflight news', short: 'snapi', screen: 4, fetchNames: ['Spaceflight News'], queryKeys: [['space', 'news']] },
  { label: 'wikimedia feed', short: 'wiki', screen: 5, fetchNames: ['Wikimedia', 'Wikipedia'], queryKeys: [['news'], ['wikipedia']] },
  { label: 'wikimedia stream', short: 'wiki', screen: 5, stream: 'wikimedia sse' },
  { label: 'bluesky', short: 'bluesky', screen: 5, fetchNames: ['Bluesky'], queryKeys: [['bluesky-trends']] },
  { label: 'github', short: 'github', screen: 6, fetchNames: ['GitHub'], queryKeys: [['github']] },
  { label: 'hn · algolia', short: 'hn', screen: 6, fetchNames: ['Hacker News'], queryKeys: [['hacker-news']] },
]

export type SourceRowStatus = 'ok' | 'degraded' | 'error' | 'reconnecting' | 'waiting'

export interface SourceRow {
  entry: SourceEntry
  status: SourceRowStatus
  /** ms of the last request this session, 'live' for a connected stream, 'cache' when only restored data is shown */
  latency: number | 'live' | 'cache' | null
  failure: Failure | null
  /** Age of the newest data shown, null when there is none */
  ageMs: number | null
  failingSince: number | null
}

/** What the cache holds for a source: newest update time and whether any query has data. */
export interface CacheState {
  updatedAt: number
  hasData: boolean
}

function streamRow(entry: SourceEntry, stream: StreamHealth | undefined, now: number): SourceRow {
  const state = stream?.state ?? 'connecting'
  if (state === 'live') return { entry, status: 'ok', latency: 'live', failure: null, ageMs: 0, failingSince: null }
  if (state === 'error') return { entry, status: 'error', latency: null, failure: { code: 'stream_lost', status: null }, ageMs: null, failingSince: stream?.lostAt ?? null }
  // A first connection has no drop time: nothing to show yet
  if (!stream?.lostAt) return { entry, status: 'waiting', latency: null, failure: null, ageMs: null, failingSince: null }
  return { entry, status: 'reconnecting', latency: null, failure: null, ageMs: now - stream.lostAt, failingSince: stream.lostAt }
}

/** One [1.2] row: a source is degraded when it fails but cached data is still shown, error when nothing is. */
export function sourceRow(entry: SourceEntry, records: (SourceHealth | undefined)[], stream: StreamHealth | undefined, cache: CacheState, now: number): SourceRow {
  if (entry.stream) return streamRow(entry, stream, now)
  const known = records.filter((record): record is SourceHealth => record !== undefined)
  const failing = known.filter((record) => record.lastFailure !== null).sort((left, right) => (right.lastFailureAt ?? 0) - (left.lastFailureAt ?? 0))[0]
  const lastSuccess = known.filter((record) => record.lastSuccessAt !== null).sort((left, right) => (right.lastSuccessAt ?? 0) - (left.lastSuccessAt ?? 0))[0]
  const updatedAt = Math.max(cache.updatedAt, lastSuccess?.lastSuccessAt ?? 0)
  const ageMs = updatedAt > 0 ? now - updatedAt : null

  if (failing) {
    const hasData = cache.hasData || Boolean(lastSuccess)
    return { entry, status: hasData ? 'degraded' : 'error', latency: null, failure: failing.lastFailure, ageMs: hasData ? ageMs : null, failingSince: failing.lastFailureAt }
  }
  if (updatedAt === 0) return { entry, status: 'waiting', latency: null, failure: null, ageMs: null, failingSince: null }
  // Health records only exist for this session: without one the data was restored from the persisted cache
  return { entry, status: 'ok', latency: lastSuccess?.latencyMs ?? 'cache', failure: null, ageMs, failingSince: null }
}

export function countRowStatuses(rows: SourceRow[]): Record<SourceRowStatus, number> {
  const counts: Record<SourceRowStatus, number> = { ok: 0, degraded: 0, error: 0, reconnecting: 0, waiting: 0 }
  for (const row of rows) counts[row.status] += 1
  return counts
}
