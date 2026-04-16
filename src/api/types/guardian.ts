export interface GuardianArticle {
  id: string
  webTitle: string
  webUrl: string
  webPublicationDate: string
  sectionId: string
  sectionName: string
  thumbnail: string | null
  trailText: string | null
  byline: string | null
}

export type GuardianSection = 'technology' | 'science' | 'environment' | 'world' | 'business'
