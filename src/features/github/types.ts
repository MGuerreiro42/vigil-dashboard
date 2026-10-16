export interface GithubRepo {
  id: number
  name: string
  fullName: string
  description: string
  language: string | null
  stars: number
  forks: number
  url: string
  topics: string[]
}
