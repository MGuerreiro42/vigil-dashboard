import { Suspense, lazy } from 'react'
import { PageLayout } from '@/components/layout/page-layout'
import { WidgetSkeleton } from '@/components/ui/widget-skeleton'

const NaturalEventsWidget = lazy(() => import('@/features/natural-events/components/natural-events-widget').then((m) => ({ default: m.NaturalEventsWidget })))

export function NaturalEventsPage() {
  return (
    <PageLayout>
      <Suspense fallback={<WidgetSkeleton />}>
        <NaturalEventsWidget isFocused />
      </Suspense>
    </PageLayout>
  )
}
