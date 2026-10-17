import { Suspense, lazy } from 'react'
import { PageLayout, PageSection } from '@/components/layout/page-layout'
import { WidgetSkeleton } from '@/components/ui/widget-skeleton'

const NewsWidget = lazy(() => import('@/features/news/components/news-widget').then((module) => ({ default: module.NewsWidget })))
const LiveEditsWidget = lazy(() => import('@/features/pulse/components/live-edits-widget').then((module) => ({ default: module.LiveEditsWidget })))
const BlueskyTrendsWidget = lazy(() => import('@/features/pulse/components/bluesky-trends-widget').then((module) => ({ default: module.BlueskyTrendsWidget })))
const WikipediaWidget = lazy(() => import('@/features/wikipedia/components/wikipedia-widget').then((module) => ({ default: module.WikipediaWidget })))

export function NewsPage() {
  return (
    <PageLayout>
      <PageSection id="headlines">
        <Suspense fallback={<WidgetSkeleton />}><NewsWidget isFocused /></Suspense>
      </PageSection>
      <section id="pulse" className="scroll-mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 lg:h-[70vh] lg:min-h-[520px]">
        <div className="h-[70vh] min-h-[480px] lg:h-full"><Suspense fallback={<WidgetSkeleton />}><LiveEditsWidget /></Suspense></div>
        <div id="bluesky" className="scroll-mt-4 h-[70vh] min-h-[480px] lg:h-full"><Suspense fallback={<WidgetSkeleton />}><BlueskyTrendsWidget /></Suspense></div>
      </section>
      <PageSection id="discover">
        <Suspense fallback={<WidgetSkeleton />}><WikipediaWidget isFocused /></Suspense>
      </PageSection>
    </PageLayout>
  )
}
