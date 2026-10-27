import { Suspense, lazy } from 'react'
import { PageLayout, PageSection } from '@/components/layout/page-layout'
import { WidgetSkeleton } from '@/components/ui/widget-skeleton'

const NaturalEventsWidget = lazy(() => import('@/features/natural-events/components/natural-events-widget').then((module) => ({ default: module.NaturalEventsWidget })))
const EarthquakeWidget = lazy(() => import('@/features/earthquakes/components/earthquake-widget').then((module) => ({ default: module.EarthquakeWidget })))
const RadarWidget = lazy(() => import('@/features/weather/components/radar-widget').then((module) => ({ default: module.RadarWidget })))
const WeatherWidget = lazy(() => import('@/features/weather/components/weather-widget').then((module) => ({ default: module.WeatherWidget })))

export function PlanetPage() {
  return (
    <PageLayout>
      <PageSection id="natural-events">
        <Suspense fallback={<WidgetSkeleton />}><NaturalEventsWidget isFocused /></Suspense>
      </PageSection>
      <PageSection id="earthquakes">
        <Suspense fallback={<WidgetSkeleton />}><EarthquakeWidget isFocused /></Suspense>
      </PageSection>
      <PageSection id="weather">
        <Suspense fallback={<WidgetSkeleton />}><WeatherWidget isFocused /></Suspense>
      </PageSection>
      <PageSection id="radar">
        <Suspense fallback={<WidgetSkeleton />}><RadarWidget /></Suspense>
      </PageSection>
    </PageLayout>
  )
}
