import { Suspense, lazy } from 'react'
import { PageLayout, PageSection } from '@/components/layout/page-layout'
import { WidgetSkeleton } from '@/components/ui/widget-skeleton'

const ISSWidget = lazy(() => import('@/features/iss/components/iss-widget').then((module) => ({ default: module.ISSWidget })))
const LaunchesWidget = lazy(() => import('@/features/space/components/launches-widget').then((module) => ({ default: module.LaunchesWidget })))
const SpaceWeatherWidget = lazy(() => import('@/features/space/components/space-weather-widget').then((module) => ({ default: module.SpaceWeatherWidget })))
const AsteroidsWidget = lazy(() => import('@/features/space/components/asteroids-widget').then((module) => ({ default: module.AsteroidsWidget })))
const SpaceNewsWidget = lazy(() => import('@/features/space/components/space-news-widget').then((module) => ({ default: module.SpaceNewsWidget })))

export function SpacePage() {
  return (
    <PageLayout>
      <PageSection id="iss">
        <Suspense fallback={<WidgetSkeleton />}><ISSWidget isFocused /></Suspense>
      </PageSection>
      <section id="launches" className="scroll-mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 lg:h-[70vh] lg:min-h-[520px]">
        <div className="h-[70vh] min-h-[480px] lg:h-full"><Suspense fallback={<WidgetSkeleton />}><LaunchesWidget /></Suspense></div>
        <div id="space-weather" className="scroll-mt-4 h-[70vh] min-h-[480px] lg:h-full"><Suspense fallback={<WidgetSkeleton />}><SpaceWeatherWidget /></Suspense></div>
      </section>
      <section id="asteroids" className="scroll-mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 lg:h-[60vh] lg:min-h-[440px]">
        <div className="h-[60vh] min-h-[420px] lg:h-full"><Suspense fallback={<WidgetSkeleton />}><AsteroidsWidget /></Suspense></div>
        <div id="space-news" className="scroll-mt-4 h-[60vh] min-h-[420px] lg:h-full"><Suspense fallback={<WidgetSkeleton />}><SpaceNewsWidget /></Suspense></div>
      </section>
    </PageLayout>
  )
}
