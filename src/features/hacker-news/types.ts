export interface HackerNewsStory {
  id: string
  title: string
  /** External link, or null for Ask HN-style text posts */
  url: string | null
  domain: string | null
  author: string
  points: number
  comments: number
  /** Unix seconds */
  createdAt: number
  discussionUrl: string
}
