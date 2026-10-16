import { Suspense, lazy } from 'react'
import { PageLayout } from '@/components/layout/page-layout'
import { WidgetSkeleton } from '@/components/ui/widget-skeleton'

const ISSWidget = lazy(() => import('@/features/iss/components/iss-widget').then((module) => ({ default: module.ISSWidget })))

export function SpacePage() {
  return (
    <PageLayout>
      <Suspense fallback={<WidgetSkeleton />}>
        <ISSWidget isFocused />
      </Suspense>
    </PageLayout>
  )
}
