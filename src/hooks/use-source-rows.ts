import { useQueryClient } from '@tanstack/react-query'
import { useNow } from '@/hooks/use-now'
import { SOURCE_REGISTRY, sourceRow, type CacheState, type SourceRow } from '@/lib/source-registry'
import { useSourceHealthStore } from '@/store/source-health-store'

/** Health of every registered source, re-read each second so ages tick. */
export function useSourceRows(): { rows: SourceRow[]; now: number } {
  const now = useNow(1_000)
  const sources = useSourceHealthStore((state) => state.sources)
  const streams = useSourceHealthStore((state) => state.streams)
  const queryCache = useQueryClient().getQueryCache()

  const rows = SOURCE_REGISTRY.map((entry) => {
    const queries = (entry.queryKeys ?? []).flatMap((queryKey) => queryCache.findAll({ queryKey }))
    const cache: CacheState = {
      updatedAt: Math.max(0, ...queries.map((query) => query.state.dataUpdatedAt)),
      hasData: queries.some((query) => query.state.data !== undefined),
    }
    const records = (entry.fetchNames ?? []).map((name) => sources[name])
    return sourceRow(entry, records, entry.stream ? streams[entry.stream] : undefined, cache, now)
  })
  return { rows, now }
}
