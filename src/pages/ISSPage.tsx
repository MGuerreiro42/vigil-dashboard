import { Suspense, lazy } from 'react'
import { PageLayout } from '@/components/layout/PageLayout'
import { WidgetSkeleton } from '@/components/ui/WidgetSkeleton'

const ISSWidget = lazy(() => import('@/widgets/iss/ISSWidget').then((m) => ({ default: m.ISSWidget })))

export function ISSPage() {
  return (
    <PageLayout>
      <Suspense fallback={<WidgetSkeleton />}>
        <ISSWidget isFocused />
      </Suspense>
    </PageLayout>
  )
}
