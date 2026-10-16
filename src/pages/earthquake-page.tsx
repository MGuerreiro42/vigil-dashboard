import { Suspense, lazy } from 'react'
import { PageLayout } from '@/components/layout/page-layout'
import { WidgetSkeleton } from '@/components/ui/widget-skeleton'

const EarthquakeWidget = lazy(() => import('@/features/earthquakes/components/earthquake-widget').then((module) => ({ default: module.EarthquakeWidget })))

export function EarthquakePage() {
  return (
    <PageLayout>
      <Suspense fallback={<WidgetSkeleton />}>
        <EarthquakeWidget isFocused />
      </Suspense>
    </PageLayout>
  )
}
