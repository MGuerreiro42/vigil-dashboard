import { useQuery } from '@tanstack/react-query'
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

async function fetchGuardianNews(section: GuardianSection): Promise<GuardianArticle[]> {
  const params = new URLSearchParams({
    section,
    'page-size': '20',
    'show-fields': 'thumbnail,trailText,byline',
    'order-by': 'newest',
    'api-key': API_KEY,
  })
  const res = await fetch(`${BASE}/search?${params}`)
  if (!res.ok) throw new Error(`Guardian API: ${res.status}`)
  const data = await res.json()
  return (data.response?.results ?? []).map(normalizeArticle)
}

export function useGuardianNews(section: GuardianSection) {
  return useQuery({
    queryKey: ['guardian', section],
    queryFn: () => fetchGuardianNews(section),
    staleTime: 10 * 60_000,
    refetchInterval: 15 * 60_000,
  })
}
