import { Suspense, lazy } from 'react'
import { PageLayout } from '@/components/layout/page-layout'
import { WidgetSkeleton } from '@/components/ui/widget-skeleton'

const WikipediaWidget = lazy(() => import('@/features/wikipedia/components/wikipedia-widget').then((module) => ({ default: module.WikipediaWidget })))

export function WikipediaPage() {
  return (
    <PageLayout>
      <Suspense fallback={<WidgetSkeleton />}>
        <WikipediaWidget isFocused />
      </Suspense>
    </PageLayout>
  )
}
