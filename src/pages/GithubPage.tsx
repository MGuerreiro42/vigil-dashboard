import { Suspense, lazy } from 'react'
import { PageLayout } from '@/components/layout/PageLayout'
import { WidgetSkeleton } from '@/components/ui/WidgetSkeleton'

const GithubWidget = lazy(() => import('@/widgets/github/GithubWidget').then((m) => ({ default: m.GithubWidget })))

export function GithubPage() {
  return (
    <PageLayout>
      <Suspense fallback={<WidgetSkeleton />}>
        <GithubWidget isFocused />
      </Suspense>
    </PageLayout>
  )
}
