export type HNStoryType = 'story' | 'job' | 'ask' | 'show'

export interface HNStory {
  id: number
  title: string
  url: string | null
  score: number
  descendants: number
  by: string
  time: number
  type: HNStoryType
}
