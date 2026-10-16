import { Suspense, lazy } from 'react'
import { PageLayout } from '@/components/layout/page-layout'
import { WidgetSkeleton } from '@/components/ui/widget-skeleton'

const WeatherWidget = lazy(() => import('@/features/weather/components/weather-widget').then((m) => ({ default: m.WeatherWidget })))

export function WeatherPage() {
  return (
    <PageLayout>
      <Suspense fallback={<WidgetSkeleton />}>
        <WeatherWidget isFocused />
      </Suspense>
    </PageLayout>
  )
}
