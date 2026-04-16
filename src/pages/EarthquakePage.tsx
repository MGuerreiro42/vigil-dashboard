import { Suspense, lazy } from 'react'
import { PageLayout } from '@/components/layout/PageLayout'
import { WidgetSkeleton } from '@/components/ui/WidgetSkeleton'

const EarthquakeWidget = lazy(() => import('@/widgets/earthquakes/EarthquakeWidget').then((m) => ({ default: m.EarthquakeWidget })))

export function EarthquakePage() {
  return (
    <PageLayout>
      <Suspense fallback={<WidgetSkeleton />}>
        <EarthquakeWidget isFocused />
      </Suspense>
    </PageLayout>
  )
}
