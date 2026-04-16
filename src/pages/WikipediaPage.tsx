import { Suspense, lazy } from 'react'
import { PageLayout } from '@/components/layout/PageLayout'
import { WidgetSkeleton } from '@/components/ui/WidgetSkeleton'

const WikipediaWidget = lazy(() => import('@/widgets/wikipedia/WikipediaWidget').then((m) => ({ default: m.WikipediaWidget })))

export function WikipediaPage() {
  return (
    <PageLayout>
      <Suspense fallback={<WidgetSkeleton />}>
        <WikipediaWidget isFocused />
      </Suspense>
    </PageLayout>
  )
}
