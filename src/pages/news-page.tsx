import { PageLayout } from '@/components/layout/page-layout'
import { NewsWidget } from '@/features/news/components/news-widget'

export function NewsPage() {
  return (
    <PageLayout>
      <NewsWidget isFocused />
    </PageLayout>
  )
}
