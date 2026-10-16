import { useQuery } from '@tanstack/react-query'
import { fetchOk } from '@/lib/http'
import { queryKeys } from './queryKeys'
import type { GuardianArticle, GuardianSection } from './types/guardian'

// The Guardian Open Platform — free developer key ('test') is officially supported
// by The Guardian and works from any origin (CORS: *). Non-commercial portfolio use allowed.
// For higher quotas, register a free key at https://open-platform.theguardian.com/
const API_KEY = import.meta.env.VITE_GUARDIAN_API_KEY ?? 'test'
const BASE = 'https://content.guardianapis.com'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeArticle(raw: any): GuardianArticle {
  const fields = raw.fields ?? {}
  // Guardian trail text may contain HTML tags — strip them
  const trailText = fields.trailText
    ? fields.trailText.replace(/<[^>]+>/g, '')
    : null
  return {
    id: raw.id,
    webTitle: raw.webTitle ?? '',
    webUrl: raw.webUrl ?? '',
    webPublicationDate: raw.webPublicationDate ?? '',
    sectionId: raw.sectionId ?? '',
    sectionName: raw.sectionName ?? '',
    thumbnail: fields.thumbnail ?? null,
    trailText,
    byline: fields.byline ?? null,
  }
}

async function fetchGuardianNews(section: GuardianSection, signal: AbortSignal): Promise<GuardianArticle[]> {
  const params = new URLSearchParams({
    section,
    'page-size': '20',
    'show-fields': 'thumbnail,trailText,byline',
    'order-by': 'newest',
    'api-key': API_KEY,
  })
  const response = await fetchOk(`${BASE}/search?${params}`, 'Guardian', { signal })
  return ((await response.json()).response?.results ?? []).map(normalizeArticle)
}

export function useGuardianNews(section: GuardianSection) {
  return useQuery({
    queryKey: queryKeys.news(section),
    queryFn: ({ signal }) => fetchGuardianNews(section, signal),
    staleTime: 10 * 60_000,
    refetchInterval: 15 * 60_000,
  })
}
