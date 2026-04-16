import { Suspense, lazy } from 'react'
import { PageLayout } from '@/components/layout/PageLayout'
import { WidgetSkeleton } from '@/components/ui/WidgetSkeleton'

const NaturalEventsWidget = lazy(() => import('@/widgets/naturalevents/NaturalEventsWidget').then((m) => ({ default: m.NaturalEventsWidget })))

export function NaturalEventsPage() {
  return (
    <PageLayout>
      <Suspense fallback={<WidgetSkeleton />}>
        <NaturalEventsWidget isFocused />
      </Suspense>
    </PageLayout>
  )
}
