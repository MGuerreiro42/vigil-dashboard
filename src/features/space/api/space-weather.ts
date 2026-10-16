import { useQuery } from '@tanstack/react-query'
import { fetchOk } from '@/lib/http'
import { queryKeys } from '@/lib/query-keys'
import type { KpReading, SpaceAlert } from '@/features/space/types'

const SWPC = 'https://services.swpc.noaa.gov/products'
const MAX_ALERTS = 8

export function parseKpIndex(raw: { time_tag: string; Kp: number }[]): KpReading[] {
  return raw
    .filter((row) => Number.isFinite(row.Kp))
    // SWPC timestamps are UTC without a zone suffix
    .map((row) => ({ time: `${row.time_tag}Z`, kp: row.Kp }))
}

const KINDS = ['alert', 'warning', 'watch', 'summary'] as const

export function parseSpaceAlerts(raw: { product_id: string; issue_datetime: string; message: string }[]): SpaceAlert[] {
  return raw
    .map((bulletin) => {
      const line = bulletin.message.split(/\r?\n/).find((text) => /^(ALERT|WARNING|WATCH|SUMMARY|EXTENDED WARNING|CANCEL WARNING):/i.test(text.trim()))
      const label = line?.split(':')[0].trim().toLowerCase() ?? ''
      const kind: SpaceAlert['kind'] = KINDS.find((candidate) => label.endsWith(candidate)) ?? 'other'
      return {
        id: `${bulletin.product_id}-${bulletin.issue_datetime}`,
        issuedAt: `${bulletin.issue_datetime.replace(' ', 'T')}Z`,
        headline: line ? line.slice(line.indexOf(':') + 1).trim() : bulletin.product_id,
        kind,
      }
    })
    .sort((first, second) => second.issuedAt.localeCompare(first.issuedAt))
    .slice(0, MAX_ALERTS)
}

export function useKpIndex() {
  return useQuery({
    queryKey: queryKeys.space.kpIndex(),
    queryFn: async ({ signal }) => parseKpIndex(await (await fetchOk(`${SWPC}/noaa-planetary-k-index.json`, 'NOAA SWPC', { signal })).json()),
    staleTime: 10 * 60_000,
    refetchInterval: 15 * 60_000,
  })
}

export function useSpaceAlerts() {
  return useQuery({
    queryKey: queryKeys.space.alerts(),
    queryFn: async ({ signal }) => parseSpaceAlerts(await (await fetchOk(`${SWPC}/alerts.json`, 'NOAA SWPC', { signal })).json()),
    staleTime: 10 * 60_000,
    refetchInterval: 15 * 60_000,
  })
}
