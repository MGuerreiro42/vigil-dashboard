import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { fetchOk } from '@/lib/http'
import { queryKeys } from '@/lib/query-keys'
import type { FeaturedFeed, OnThisDayEvent, TrendingArticle, WikiArticleRef } from '@/features/news/types'

export type FeedLanguage = 'pt' | 'en'

const MAX_HEADLINES = 20
const MAX_TRENDING = 20

// Raw payload: only the fields we read (https://en.wikipedia.org/api/rest_v1/#/Feed)
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

// pt stories open with "11 de outubro de 2026 - "; en ones carry the date in a leading "<!--Oct 11-->" comment
const PT_DATE_PREFIX = /^(\d{1,2}) de ([a-zç]+) de (\d{4})\s*[-–—]\s*/i
const EN_DATE_COMMENT = /^\s*<!--\s*([A-Z][a-z]{2})[a-z]*\s+(\d{1,2})\s*-->/
const PT_MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const isoDay = (year: number, monthIndex: number, day: number) =>
  `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

/** The en comment has no year: it is the feed's year, or the previous one for a December story read in January. */
function enStoryDate(html: string, feedDay: Date): string | null {
  const match = html.match(EN_DATE_COMMENT)
  const monthIndex = match ? EN_MONTHS.indexOf(match[1]) : -1
  if (!match || monthIndex < 0) return null
  const day = Number(match[2])
  const sameYear = new Date(feedDay.getFullYear(), monthIndex, day) <= feedDay
  return isoDay(feedDay.getFullYear() - (sameYear ? 0 : 1), monthIndex, day)
}

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

export function parseFeaturedFeed(raw: RawFeed, lang: FeedLanguage, feedDay = new Date()): FeaturedFeed {
  const headlines = (raw.news ?? []).slice(0, MAX_HEADLINES).map((item, index) => {
    const text = plainText(item.story)
    const ptMatch = text.match(PT_DATE_PREFIX)
    const ptMonth = ptMatch ? PT_MONTHS.indexOf(ptMatch[2].toLowerCase()) : -1
    // The page with a thumbnail makes the best visual anchor for the story
    const lead = item.links.find((link) => link.thumbnail) ?? item.links[0]
    return {
      id: `${index}-${lead?.title ?? text.slice(0, 20)}`,
      text: ptMatch ? text.slice(ptMatch[0].length) : text,
      date: ptMatch && ptMonth >= 0 ? isoDay(Number(ptMatch[3]), ptMonth, Number(ptMatch[1])) : enStoryDate(item.story, feedDay),
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

async function fetchRawFeed(lang: FeedLanguage, date: string, signal: AbortSignal): Promise<RawFeed> {
  return (await fetchOk(`https://${lang}.wikipedia.org/api/rest_v1/feed/featured/${date}`, 'Wikimedia', { signal })).json()
}

async function fetchFeaturedFeed(lang: FeedLanguage, date: string, signal: AbortSignal): Promise<FeaturedFeed> {
  const raw = await fetchRawFeed(lang, date, signal)
  // Today's most-read list is only published later in the (UTC) day; yesterday's fills the gap
  if (!raw.mostread) {
    const yesterday = feedDate(new Date(Date.now() - 86_400_000))
    raw.mostread = (await fetchRawFeed(lang, yesterday, signal).catch(() => null))?.mostread
  }
  return parseFeaturedFeed(raw, lang)
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
