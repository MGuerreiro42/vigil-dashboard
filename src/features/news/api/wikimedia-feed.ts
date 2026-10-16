import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { fetchOk } from '@/lib/http'
import { queryKeys } from '@/lib/query-keys'
import type { FeaturedFeed, OnThisDayEvent, TrendingArticle, WikiArticleRef } from '@/features/news/types'

export type FeedLanguage = 'pt' | 'en'

const MAX_HEADLINES = 20
const MAX_TRENDING = 20

// Raw payload: only the fields we read (https://api.wikimedia.org/wiki/Feed_API)
type RawPage = {
  title: string
  normalizedtitle?: string
  description?: string
  thumbnail?: { source: string }
  content_urls?: { desktop?: { page?: string } }
}
type RawFeed = {
  news?: { story: string; links: RawPage[] }[]
  mostread?: { articles: (RawPage & { rank: number; views: number; view_history?: { views: number }[] })[] }
  onthisday?: { year: number; text: string; pages: RawPage[] }[]
}

// Special pages (Main_Page, Special:Search) dominate "most read" but aren't articles
const NON_ARTICLE = /^(Main_Page|Wikipédia:Página_principal|Special:|Especial:|Wikipedia:|Wikipédia:)/

// "11 de outubro de 2026 - Paramount conclui…" → date label + story
const PT_DATE_PREFIX = /^(\d{1,2} de [a-zà-ú]+ de \d{4})\s*[-–—]\s*/i

function plainText(html: string): string {
  return new DOMParser().parseFromString(html, 'text/html').body.textContent?.replace(/\s+/g, ' ').trim() ?? ''
}

function toArticle(page: RawPage | undefined, lang: FeedLanguage): WikiArticleRef | null {
  if (!page) return null
  return {
    title: page.normalizedtitle ?? page.title.replace(/_/g, ' '),
    description: page.description ?? null,
    url: page.content_urls?.desktop?.page ?? `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
    thumbnail: page.thumbnail?.source ?? null,
  }
}

export function parseFeaturedFeed(raw: RawFeed, lang: FeedLanguage): FeaturedFeed {
  const headlines = (raw.news ?? []).slice(0, MAX_HEADLINES).map((item, index) => {
    const text = plainText(item.story)
    const dateMatch = text.match(PT_DATE_PREFIX)
    // The page with a thumbnail makes the best visual anchor for the story
    const lead = item.links.find((link) => link.thumbnail) ?? item.links[0]
    return {
      id: `${index}-${lead?.title ?? text.slice(0, 20)}`,
      text: dateMatch ? text.slice(dateMatch[0].length) : text,
      dateLabel: dateMatch?.[1] ?? null,
      article: toArticle(lead, lang),
    }
  })

  const trending: TrendingArticle[] = (raw.mostread?.articles ?? [])
    .filter((article) => !NON_ARTICLE.test(article.title))
    .slice(0, MAX_TRENDING)
    // Re-rank after dropping special pages, so the list starts at 1
    .map((article, index) => ({
      ...toArticle(article, lang)!,
      rank: index + 1,
      views: article.views,
      history: (article.view_history ?? []).map((day) => day.views),
    }))

  const onThisDay: OnThisDayEvent[] = (raw.onthisday ?? [])
    .map((event) => ({ year: event.year, text: event.text, article: toArticle(event.pages[0], lang) }))
    .sort((first, second) => second.year - first.year)

  return { headlines, trending, onThisDay }
}

/** Feed date in UTC, the calendar the Wikimedia feed is keyed by: "2026/10/16". */
export function feedDate(now = new Date()): string {
  return now.toISOString().slice(0, 10).replace(/-/g, '/')
}

async function fetchFeaturedFeed(lang: FeedLanguage, date: string, signal: AbortSignal): Promise<FeaturedFeed> {
  const response = await fetchOk(`https://api.wikimedia.org/feed/v1/wikipedia/${lang}/featured/${date}`, 'Wikimedia', { signal })
  return parseFeaturedFeed(await response.json(), lang)
}

/** Headlines, most-read articles and "on this day", in the UI language. */
export function useFeaturedFeed() {
  const { i18n } = useTranslation()
  const lang: FeedLanguage = i18n.resolvedLanguage === 'pt' ? 'pt' : 'en'
  const date = feedDate()
  return useQuery({
    queryKey: queryKeys.news.featured(lang, date),
    queryFn: ({ signal }) => fetchFeaturedFeed(lang, date, signal),
    staleTime: 15 * 60_000,
    refetchInterval: 30 * 60_000,
  })
}
