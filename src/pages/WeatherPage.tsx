import { Suspense, lazy } from 'react'
import { PageLayout } from '@/components/layout/PageLayout'
import { WidgetSkeleton } from '@/components/ui/WidgetSkeleton'

const WeatherWidget = lazy(() => import('@/widgets/weather/WeatherWidget').then((m) => ({ default: m.WeatherWidget })))

export function WeatherPage() {
  return (
    <PageLayout>
      <Suspense fallback={<WidgetSkeleton />}>
        <WeatherWidget isFocused />
      </Suspense>
    </PageLayout>
  )
}
