export interface WikiArticleRef {
  title: string
  description: string | null
  url: string
  thumbnail: string | null
}

export interface NewsHeadline {
  id: string
  text: string
  /** Day the story happened, as yyyy-mm-dd; null when the entry carries no date */
  date: string | null
  article: WikiArticleRef | null
}

export interface TrendingArticle extends WikiArticleRef {
  rank: number
  views: number
  /** Daily views, oldest first */
  history: number[]
}

export interface OnThisDayEvent {
  year: number
  text: string
  article: WikiArticleRef | null
}

export interface FeaturedFeed {
  headlines: NewsHeadline[]
  trending: TrendingArticle[]
  onThisDay: OnThisDayEvent[]
}
