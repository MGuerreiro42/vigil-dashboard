import { Suspense, lazy } from 'react'
import { PageLayout } from '@/components/layout/page-layout'
import { WidgetSkeleton } from '@/components/ui/widget-skeleton'

const GithubWidget = lazy(() => import('@/features/github/components/github-widget').then((m) => ({ default: m.GithubWidget })))

export function GithubPage() {
  return (
    <PageLayout>
      <Suspense fallback={<WidgetSkeleton />}>
        <GithubWidget isFocused />
      </Suspense>
    </PageLayout>
  )
}
