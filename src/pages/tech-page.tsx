import { GithubPanel } from '@/features/github/components/github-panel'
import { HackerNewsPanel } from '@/features/hacker-news/components/hacker-news-panel'

export function TechPage() {
  return (
    <>
      <GithubPanel />
      <HackerNewsPanel />
    </>
  )
}
