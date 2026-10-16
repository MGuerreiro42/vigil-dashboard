export interface LiveEdit {
  id: number
  title: string
  url: string
  user: string
  isBot: boolean
  isNewArticle: boolean
  /** Wikipedia language code, e.g. "en" */
  language: string
  byteDelta: number
  /** Unix seconds, local clock, so the rolling window ignores server clock skew */
  receivedAt: number
}

export interface EditStreamSummary {
  perMinute: number
  botShare: number
  newArticles: number
  topLanguages: { language: string; count: number }[]
  /** Edits per second over the window, oldest first */
  perSecond: number[]
}

export interface BlueskyTrend {
  id: string
  name: string
  description: string | null
  url: string
}
