import { Suspense, lazy } from 'react'
import { PageLayout } from '@/components/layout/page-layout'
import { WidgetSkeleton } from '@/components/ui/widget-skeleton'

const ISSWidget = lazy(() => import('@/features/iss/components/iss-widget').then((m) => ({ default: m.ISSWidget })))

export function ISSPage() {
  return (
    <PageLayout>
      <Suspense fallback={<WidgetSkeleton />}>
        <ISSWidget isFocused />
      </Suspense>
    </PageLayout>
  )
}
