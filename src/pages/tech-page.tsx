import { Suspense, lazy } from 'react'
import { PageLayout, PageSection } from '@/components/layout/page-layout'
import { WidgetSkeleton } from '@/components/ui/widget-skeleton'

const GithubWidget = lazy(() => import('@/features/github/components/github-widget').then((module) => ({ default: module.GithubWidget })))
const HackerNewsWidget = lazy(() => import('@/features/hacker-news/components/hacker-news-widget').then((module) => ({ default: module.HackerNewsWidget })))

export function TechPage() {
  return (
    <PageLayout stacked>
      <PageSection id="github">
        <Suspense fallback={<WidgetSkeleton />}><GithubWidget isFocused /></Suspense>
      </PageSection>
      <PageSection id="hacker-news">
        <Suspense fallback={<WidgetSkeleton />}><HackerNewsWidget /></Suspense>
      </PageSection>
    </PageLayout>
  )
}
