import { Suspense, lazy } from 'react'
import { PageLayout, PageSection } from '@/components/layout/page-layout'
import { WidgetSkeleton } from '@/components/ui/widget-skeleton'

const NewsWidget = lazy(() => import('@/features/news/components/news-widget').then((module) => ({ default: module.NewsWidget })))
const WikipediaWidget = lazy(() => import('@/features/wikipedia/components/wikipedia-widget').then((module) => ({ default: module.WikipediaWidget })))

export function NewsPage() {
  return (
    <PageLayout stacked>
      <PageSection id="headlines">
        <Suspense fallback={<WidgetSkeleton />}><NewsWidget isFocused /></Suspense>
      </PageSection>
      <PageSection id="discover">
        <Suspense fallback={<WidgetSkeleton />}><WikipediaWidget isFocused /></Suspense>
      </PageSection>
    </PageLayout>
  )
}
