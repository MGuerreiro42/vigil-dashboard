import type { EditStreamSummary, LiveEdit } from '@/features/pulse/types'

export const WINDOW_SECONDS = 60

export type RawRecentChange = {
  id: number
  type: string
  namespace: number
  title: string
  title_url?: string
  user: string
  bot: boolean
  server_name: string
  length?: { old?: number; new?: number }
}

/** Keeps article edits and creations on any Wikipedia; drops Wikidata, Commons, talk pages and categorization. */
export function toLiveEdit(raw: RawRecentChange, receivedAt: number): LiveEdit | null {
  if ((raw.type !== 'edit' && raw.type !== 'new') || raw.namespace !== 0 || !raw.server_name.endsWith('.wikipedia.org')) return null
  return {
    id: raw.id,
    title: raw.title,
    url: raw.title_url ?? `https://${raw.server_name}/wiki/${encodeURIComponent(raw.title.replaceAll(' ', '_'))}`,
    user: raw.user,
    isBot: raw.bot,
    isNewArticle: raw.type === 'new',
    language: raw.server_name.split('.')[0],
    byteDelta: (raw.length?.new ?? 0) - (raw.length?.old ?? 0),
    receivedAt,
  }
}

/** Edits must already be trimmed to the last WINDOW_SECONDS. */
export function summarizeEdits(edits: LiveEdit[], now: number): EditStreamSummary {
  const perSecond = new Array<number>(WINDOW_SECONDS).fill(0)
  const languageCounts = new Map<string, number>()
  let bots = 0
  let newArticles = 0
  for (const edit of edits) {
    const slot = WINDOW_SECONDS - 1 - Math.floor(now - edit.receivedAt)
    if (slot >= 0) perSecond[slot] += 1
    languageCounts.set(edit.language, (languageCounts.get(edit.language) ?? 0) + 1)
    if (edit.isBot) bots += 1
    if (edit.isNewArticle) newArticles += 1
  }
  return {
    perMinute: edits.length,
    botShare: edits.length ? bots / edits.length : 0,
    newArticles,
    topLanguages: [...languageCounts]
      .map(([language, count]) => ({ language, count }))
      .sort((first, second) => second.count - first.count)
      .slice(0, 6),
    perSecond,
  }
}
